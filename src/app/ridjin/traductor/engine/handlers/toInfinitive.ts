import { LanguageMode } from "@/app/components/types/components.type";
import type {
  IRSentence,
  IRToken,
  PersonNumber,
  TranslationPart,
  TranslationResult,
} from "../../core/types";
import { matchVerbAt } from "../../rules/verb";
import type { VerbMatch } from "../../rules/verb";
import { expandInclusiveExclusive } from "../../logic/subjects";
import {
  appendObjectSequences,
  buildObjectSequencesFromMatch,
  collectObjectSequencesAfterVerb,
  filterComitativeHumanSequences,
  filterInstrumentalNonHumanSequences,
  matchAllativeMarkerAt,
  matchAllativePhraseAt,
  matchAblativePhraseAt,
  matchBelongingAboutPhraseAt,
  matchBelongingPurposePhraseAt,
  matchComitativePhraseAt,
  matchInstrumentalPhraseAt,
  matchIndirectPhraseAt,
  matchOriginPhraseAt,
  matchPurposeAmbiguousAltAt,
  matchPurposePhraseAt,
  shouldAllowAboutLocativeAlt,
  matchLocativePhraseAt,
} from "../../logic/objects";
import {
  buildLocativePart,
  matchLocativeMarkerAt,
  resolveAllativeVerbEntry,
} from "../../logic/locative";
import { buildBranches, stripTrailingSequences } from "../../logic/branching";
import { createInfinitivePart, createParticlePart, createVerbPart, finalizePart } from "../../logic/parts";
import { matchInfinitiveAt } from "../../logic/verbAux";
import { normalizeToken } from "../../logic/tokenUtils";
import type { TranslateHelpers, TranslateState } from "../types";

export function handleToInfinitive(args: {
  ir: IRSentence;
  token: IRToken;
  index: number;
  sourceLang: LanguageMode;
  state: TranslateState;
  helpers: TranslateHelpers;
}): { handled: boolean; nextIndex?: number } {
  const { ir, token, index, sourceLang, state, helpers } = args;
  if (sourceLang !== "en") return { handled: false };

  const normalized = normalizeToken(token.source, sourceLang);
  if (normalized !== "to") return { handled: false };

  const buildUnknownStripPart = (source: string): TranslationPart =>
    finalizePart(
      {
        type: "unknown",
        source,
        gup: source,
        output: source,
        explanation: "",
        explanations: [
          { key: "PIPELINE_PLACEHOLDER" },
          { key: "TOKEN_PASSTHROUGH", data: { token: source } },
        ],
      },
      sourceLang
    );

  const buildAuxStripSequences = (
    auxMatch: VerbMatch | null,
    trailingUnknowns: string[] = []
  ): TranslationPart[][] => {
    const suffixParts = trailingUnknowns.map(buildUnknownStripPart);
    const sequences: TranslationPart[][] = [];
    if (!auxMatch) {
      if (suffixParts.length > 0) sequences.push(suffixParts);
      return sequences;
    }
    const gup = auxMatch.entry.gupForms[0] ?? auxMatch.entry.gup;
    const verbPart = createVerbPart(
      auxMatch,
      sourceLang,
      gup,
      "VERB_PRESENT_POS"
    );
    const gaPart = createParticlePart(
      "ga",
      sourceLang,
      "VERB_PARTICLE_POS",
      ["yukurra"]
    );
    const yukurraPart = createParticlePart(
      "yukurra",
      sourceLang,
      "VERB_PARTICLE_POS"
    );
    sequences.push([gaPart, verbPart, ...suffixParts]);
    sequences.push([yukurraPart, verbPart, ...suffixParts]);
    if (suffixParts.length === 0) {
      sequences.push([gaPart, verbPart]);
      sequences.push([yukurraPart, verbPart]);
    }
    return sequences;
  };

  const isAllowedNearFuturePersons = (persons: PersonNumber[]): boolean => {
    if (persons.length === 0) return false;
    const allowed = new Set<PersonNumber>([
      "1_Sing",
      "1+2_Dual",
      "1+2_Plur",
    ]);
    return persons.every((person) => allowed.has(person));
  };

  const filterNearFutureCombos = (
    combos: TranslationResult["combinations"]
  ): TranslationResult["combinations"] => {
    const allowedGups = new Set([
      "ŋarra",
      "rra",
      "ŋali",
      "ŋilimurru",
      "ŋalimurru",
      "limurru",
    ]);
    return combos.filter((combo) => {
      const hasPronoun = combo.parts.some((part) => part.type === "pronoun");
      if (!hasPronoun) return true;
      return combo.parts.some(
        (part) => part.type === "pronoun" && allowedGups.has(part.gup)
      );
    });
  };

  const hasSubjectPronounInCombos = (
    combos: TranslationResult["combinations"]
  ): boolean =>
    combos.some((combo) =>
      combo.parts.some(
        (part) =>
          part.type === "pronoun" &&
          (part.explanations ?? []).some((exp) =>
            exp.key.startsWith("PRONOUN_SUBJECT") ||
            exp.key === "SUBJECT_IMPLIED"
          )
      )
    );

  const detectNearFutureEn = (
    tokens: IRToken[],
    toIndex: number
  ): { stripSequences: TranslationPart[][] } | null => {
    const prev = normalizeToken(tokens[toIndex - 1]?.source ?? "", sourceLang);
    if (["going", "about"].includes(prev)) {
      if (prev === "going") {
        const auxMatch =
          matchVerbAt(tokens, toIndex - 1, sourceLang).find(
            (match) => match.kind === "gerund" || match.kind === "present"
          ) ?? null;
        return { stripSequences: buildAuxStripSequences(auxMatch) };
      }
      return {
        stripSequences: buildAuxStripSequences(null, [
          tokens[toIndex - 1]?.source ?? "about",
        ]),
      };
    }
    return null;
  };

  let infinitiveMatch = matchInfinitiveAt(ir.tokens, index + 1, sourceLang);
  if (!infinitiveMatch) {
    const fallbackMatches = matchVerbAt(ir.tokens, index + 1, sourceLang);
    if (fallbackMatches.length > 0) {
      const preferred =
        fallbackMatches.find((match) => match.kind === "present") ??
        fallbackMatches[0];
      infinitiveMatch = { match: preferred, attachedObject: null };
    }
  }
  if (!infinitiveMatch) {
    return { handled: false };
  }

  const hasSubjectImmediate =
    state.lastSubject && state.lastSubject.endIndex === index - 1;
  const lastVerbEndIndex = helpers.getSubjectEndIndex(state.lastVerbSubject);
  const hasVerbContext =
    lastVerbEndIndex !== null && lastVerbEndIndex >= index - 1;
  const lastSubjectPersons = helpers.getSubjectPersons(state.lastSubject);
  const lastVerbPersons = helpers.getSubjectPersons(state.lastVerbSubject);
  const infinitivePersons = expandInclusiveExclusive(
    lastSubjectPersons ?? lastVerbPersons ?? []
  );
  const subjectParts =
    !hasSubjectImmediate &&
    infinitivePersons.length > 0 &&
    !hasVerbContext
      ? helpers.buildImpliedSubjectParts(
          infinitivePersons,
          state.lastSubject?.sourceToken
        )
      : [];
  const allowNonHumanDemonstrative = Boolean(infinitiveMatch.match.entry.isTransitive);
  const reflexivePersons = infinitiveMatch.match.entry.isTransitive
    ? infinitivePersons
    : undefined;
  const reflexivePossessivePersons =
    infinitivePersons.length > 0 ? infinitivePersons : undefined;
  const reflexivePossessiveOptions = {
    reflexivePersons: reflexivePossessivePersons,
    reflexiveSubjectRepeat: true,
  };
  const preObject = buildObjectSequencesFromMatch(
    infinitiveMatch.attachedObject,
    sourceLang,
    { allowNonHumanDemonstrative }
  );
  const verbConsumed = infinitiveMatch.match.consumed ?? 1;
  const afterObjects = collectObjectSequencesAfterVerb(
    ir.tokens,
    index + 1 + verbConsumed,
    sourceLang,
    {
      comitativePossessive: true,
      allowNonHumanDemonstrative,
      reflexivePersons,
      reflexiveSubjectRepeat: true,
    }
  );

  if (afterObjects.hasAmbiguity) {
    state.hasAmbiguity = true;
  }
  let objectSequences = appendObjectSequences(
    preObject.sequences,
    afterObjects.sequences
  );
  const originSequences = afterObjects.originSequences
    ? appendObjectSequences(preObject.sequences, afterObjects.originSequences)
    : null;
  const originHasAmbiguity = Boolean(afterObjects.originHasAmbiguity);
  let purposeSequences: TranslationPart[][] | null = null;
  let purposeHasAmbiguity = false;
  let belongingPurposeSequences: TranslationPart[][] | null = null;
  let belongingPurposeHasAmbiguity = false;
  let belongingAboutSequences: TranslationPart[][] | null = null;
  let belongingAboutHasAmbiguity = false;
  let aboutAltSequences: TranslationPart[][] | null = null;
  let aboutAltHasAmbiguity = false;
  let indirectSequences: TranslationPart[][] | null = null;
  let indirectHasAmbiguity = false;
  let instrumentalSequences: TranslationPart[][] | null = null;
  let instrumentalHasAmbiguity = false;
  const objectDropAmbiguity = preObject.hasDrop || afterObjects.hasDrop;
  let objectConsumed = afterObjects.consumed;
  let hasAllative = false;

  let modifierConsumed = 0;
  let searching = true;
  while (searching) {
    searching = false;
    let appliedInstrumental = false;
    const modifierIndex = index + 1 + verbConsumed + objectConsumed + modifierConsumed;
    const instrumentalPhrase = matchInstrumentalPhraseAt(
      ir.tokens,
      modifierIndex,
      sourceLang
    );
    const instrumentalLead = instrumentalPhrase?.preposition.normalized
      .split(" ")
      .shift();
    const isConWithPrep = instrumentalLead === "with";
    const applyInstrumentalPossessiveAlt = (baseSequences: TranslationPart[][]) => {
      if (!instrumentalPhrase?.possessiveAltSequences) return;
      const newSequences = appendObjectSequences(
        baseSequences,
        instrumentalPhrase.possessiveAltSequences
      );
      if (!instrumentalSequences) {
        instrumentalSequences = newSequences;
      } else {
        instrumentalSequences = [...instrumentalSequences, ...newSequences];
      }
      if (instrumentalPhrase.possessiveAltHasAmbiguity) {
        instrumentalHasAmbiguity = true;
      }
    };
    const applyInstrumentalAlt = (baseSequences: TranslationPart[][]) => {
      if (!instrumentalPhrase || instrumentalPhrase.isExclusive) return;
      if (isConWithPrep) return;
      if (appliedInstrumental) return;
      if (!instrumentalSequences) {
        instrumentalSequences = appendObjectSequences(
          baseSequences,
          instrumentalPhrase.sequences
        );
      } else {
        instrumentalSequences = appendObjectSequences(
          instrumentalSequences,
          instrumentalPhrase.sequences
        );
      }
      if (instrumentalPhrase.hasAmbiguity) {
        instrumentalHasAmbiguity = true;
      }
      appliedInstrumental = true;
    };
    applyInstrumentalPossessiveAlt(objectSequences);
    if (instrumentalPhrase?.isExclusive) {
      objectSequences = appendObjectSequences(
        objectSequences,
        instrumentalPhrase.sequences
      );
      if (purposeSequences) {
        purposeSequences = appendObjectSequences(
          purposeSequences,
          instrumentalPhrase.sequences
        );
      }
      if (indirectSequences) {
        indirectSequences = appendObjectSequences(
          indirectSequences,
          instrumentalPhrase.sequences
        );
      }
      modifierConsumed += instrumentalPhrase.consumed;
      if (instrumentalPhrase.hasAmbiguity) {
        instrumentalHasAmbiguity = true;
      }
      searching = true;
      continue;
    }
    const indirectPhrase = matchIndirectPhraseAt(
      ir.tokens,
      modifierIndex,
      sourceLang,
      reflexivePossessiveOptions
    );
    if (indirectPhrase) {
      const baseSequences = objectSequences;
      const hasDirectObject = baseSequences.some((seq) => seq.length > 0);
      const normalized = indirectPhrase.preposition.normalized;
      const isToPreposition = normalized === "to";
      const isForPreposition = normalized === "for";
      if (isToPreposition && indirectPhrase.targetHumanity === "non-human") {
        // Non-human "a/to" should be handled as locative/allative, not IO.
      } else {
        applyInstrumentalAlt(baseSequences);
        const ioSequences = appendObjectSequences(
          baseSequences,
          indirectPhrase.sequences
        );

        if (
          isToPreposition &&
          !hasDirectObject &&
          indirectPhrase.directAltSequences
        ) {
          objectSequences = appendObjectSequences(
            baseSequences,
            indirectPhrase.directAltSequences
          );
          indirectSequences = ioSequences;
          indirectHasAmbiguity = true;
        } else {
          objectSequences = ioSequences;
        }
        if (instrumentalSequences && !instrumentalPhrase) {
          instrumentalSequences = appendObjectSequences(
            instrumentalSequences,
            indirectPhrase.sequences
          );
        }

        if (isForPreposition) {
          const purposePhrase = matchPurposePhraseAt(
            ir.tokens,
            modifierIndex,
            sourceLang,
            reflexivePossessiveOptions
          );
          if (purposePhrase) {
            if (!purposeSequences) {
              purposeSequences = appendObjectSequences(
                baseSequences,
                purposePhrase.sequences
              );
            } else {
              purposeSequences = appendObjectSequences(
                purposeSequences,
                purposePhrase.sequences
              );
            }
            if (purposePhrase.hasAmbiguity) purposeHasAmbiguity = true;
          }
          const belongingPurposePhrase = matchBelongingPurposePhraseAt(
            ir.tokens,
            modifierIndex,
            sourceLang
          );
          if (belongingPurposePhrase) {
            if (!belongingPurposeSequences) {
              belongingPurposeSequences = appendObjectSequences(
                baseSequences,
                belongingPurposePhrase.sequences
              );
            } else {
              belongingPurposeSequences = appendObjectSequences(
                belongingPurposeSequences,
                belongingPurposePhrase.sequences
              );
            }
            if (belongingPurposePhrase.hasAmbiguity) {
              belongingPurposeHasAmbiguity = true;
            }
          }
        }

        modifierConsumed += indirectPhrase.consumed;
        if (indirectPhrase.hasAmbiguity) {
          indirectHasAmbiguity = true;
        }
        searching = true;
        continue;
      }
    }
    const purposePhrase = matchPurposePhraseAt(
      ir.tokens,
      modifierIndex,
      sourceLang,
      reflexivePossessiveOptions
    );
    if (purposePhrase) {
      const belongingPurposePhrase = matchBelongingPurposePhraseAt(
        ir.tokens,
        modifierIndex,
        sourceLang
      );
      if (belongingPurposePhrase) {
        if (!belongingPurposeSequences) {
          belongingPurposeSequences = appendObjectSequences(
            objectSequences,
            belongingPurposePhrase.sequences
          );
        } else {
          belongingPurposeSequences = appendObjectSequences(
            belongingPurposeSequences,
            belongingPurposePhrase.sequences
          );
        }
        if (belongingPurposePhrase.hasAmbiguity) {
          belongingPurposeHasAmbiguity = true;
        }
      }
      applyInstrumentalAlt(objectSequences);
      const hasMotionVerb = infinitiveMatch.match.entry.motionType === "motion";
      const purposeAlt =
        purposePhrase.targetHumanity !== "human"
          ? matchPurposeAmbiguousAltAt(
              ir.tokens,
              modifierIndex,
              sourceLang,
              purposePhrase.preposition,
              hasMotionVerb,
              reflexivePossessiveOptions
            )
          : null;
      if (purposeAlt) {
        if (!purposeSequences) {
          purposeSequences = appendObjectSequences(
            objectSequences,
            purposeAlt.sequences
          );
        }
        objectSequences = appendObjectSequences(
          objectSequences,
          purposePhrase.sequences
        );
        if (indirectSequences) {
          indirectSequences = appendObjectSequences(
            indirectSequences,
            purposePhrase.sequences
          );
        }
        if (instrumentalSequences && !instrumentalPhrase) {
          instrumentalSequences = appendObjectSequences(
            instrumentalSequences,
            purposePhrase.sequences
          );
        }
        modifierConsumed += purposePhrase.consumed;
        if (purposePhrase.hasAmbiguity) {
          purposeHasAmbiguity = true;
        }
        if (purposeAlt.hasAmbiguity) {
          state.hasAmbiguity = true;
        }
        searching = true;
        continue;
      }
      const originPhrase =
        infinitiveMatch.match.entry.motionType !== "motion"
        ? matchOriginPhraseAt(
            ir.tokens,
            modifierIndex,
            sourceLang,
            reflexivePossessiveOptions
          )
        : null;
      if (originPhrase) {
        if (!purposeSequences) {
          purposeSequences = appendObjectSequences(
            objectSequences,
            originPhrase.sequences
          );
        } else {
          purposeSequences = appendObjectSequences(
            purposeSequences,
            originPhrase.sequences
          );
        }
        objectSequences = appendObjectSequences(
          objectSequences,
          purposePhrase.sequences
        );
        if (indirectSequences) {
          indirectSequences = appendObjectSequences(
            indirectSequences,
            purposePhrase.sequences
          );
        }
        if (instrumentalSequences && !instrumentalPhrase) {
          instrumentalSequences = appendObjectSequences(
            instrumentalSequences,
            purposePhrase.sequences
          );
        }
        if (purposePhrase.hasAmbiguity) purposeHasAmbiguity = true;
        modifierConsumed += originPhrase.consumed;
        if (originPhrase.hasAmbiguity) {
          state.hasAmbiguity = true;
        }
        searching = true;
        continue;
      }
      const allowComitative =
        !purposePhrase.preposition.normalized.startsWith("with ");
      const comitativePhrase = allowComitative
        ? matchComitativePhraseAt(
            ir.tokens,
            modifierIndex,
            sourceLang,
            reflexivePossessiveOptions
          )
        : null;
      if (comitativePhrase) {
        if (!purposeSequences) {
          purposeSequences = appendObjectSequences(
            objectSequences,
            purposePhrase.sequences
          );
          if (purposePhrase.hasAmbiguity) purposeHasAmbiguity = true;
        }
        objectSequences = appendObjectSequences(
          objectSequences,
          comitativePhrase.sequences
        );
        if (indirectSequences) {
          indirectSequences = appendObjectSequences(
            indirectSequences,
            comitativePhrase.sequences
          );
        }
        if (instrumentalSequences && !instrumentalPhrase) {
          instrumentalSequences = appendObjectSequences(
            instrumentalSequences,
            comitativePhrase.sequences
          );
        }
        modifierConsumed += comitativePhrase.consumed;
        if (comitativePhrase.hasAmbiguity) {
          state.hasAmbiguity = true;
        }
        searching = true;
        continue;
      }
      objectSequences = appendObjectSequences(
        objectSequences,
        purposePhrase.sequences
      );
      if (indirectSequences) {
        indirectSequences = appendObjectSequences(
          indirectSequences,
          purposePhrase.sequences
        );
      }
      if (instrumentalSequences && !instrumentalPhrase) {
        instrumentalSequences = appendObjectSequences(
          instrumentalSequences,
          purposePhrase.sequences
        );
      }
      modifierConsumed += purposePhrase.consumed;
      if (purposePhrase.hasAmbiguity) {
        state.hasAmbiguity = true;
      }
      searching = true;
      continue;
    }

    const belongingAboutPhrase = matchBelongingAboutPhraseAt(
      ir.tokens,
      modifierIndex,
      sourceLang
    );
    if (belongingAboutPhrase) {
      if (!belongingAboutSequences) {
        belongingAboutSequences = appendObjectSequences(
          objectSequences,
          belongingAboutPhrase.sequences
        );
      } else {
        belongingAboutSequences = appendObjectSequences(
          belongingAboutSequences,
          belongingAboutPhrase.sequences
        );
      }
      if (belongingAboutPhrase.hasAmbiguity) {
        belongingAboutHasAmbiguity = true;
      }
      if (shouldAllowAboutLocativeAlt(belongingAboutPhrase.preposition, sourceLang)) {
        const locativeAlt = matchLocativePhraseAt(
          ir.tokens,
          modifierIndex,
          sourceLang,
          reflexivePossessiveOptions
        );
        if (locativeAlt) {
          const altSeq = appendObjectSequences(objectSequences, locativeAlt.sequences);
          aboutAltSequences = aboutAltSequences
            ? [...aboutAltSequences, ...altSeq]
            : altSeq;
          if (locativeAlt.hasAmbiguity) {
            aboutAltHasAmbiguity = true;
          }
        }
        const ablativeAlt = matchAblativePhraseAt(
          ir.tokens,
          modifierIndex,
          sourceLang,
          reflexivePossessiveOptions
        );
        if (ablativeAlt) {
          const altSeq = appendObjectSequences(objectSequences, ablativeAlt.sequences);
          aboutAltSequences = aboutAltSequences
            ? [...aboutAltSequences, ...altSeq]
            : altSeq;
          if (ablativeAlt.hasAmbiguity) {
            aboutAltHasAmbiguity = true;
          }
        }
      }
      modifierConsumed += belongingAboutPhrase.consumed;
      searching = true;
      continue;
    }

    if (infinitiveMatch.match.entry.motionType !== "motion") {
      applyInstrumentalAlt(objectSequences);
      const originPhrase = matchOriginPhraseAt(
        ir.tokens,
        modifierIndex,
        sourceLang,
        reflexivePossessiveOptions
      );
      if (originPhrase) {
        objectSequences = appendObjectSequences(
          objectSequences,
          originPhrase.sequences
        );
        if (purposeSequences) {
          purposeSequences = appendObjectSequences(
            purposeSequences,
            originPhrase.sequences
          );
        }
        if (indirectSequences) {
          indirectSequences = appendObjectSequences(
            indirectSequences,
            originPhrase.sequences
          );
        }
        if (instrumentalSequences && !instrumentalPhrase) {
          instrumentalSequences = appendObjectSequences(
            instrumentalSequences,
            originPhrase.sequences
          );
        }
        modifierConsumed += originPhrase.consumed;
        if (originPhrase.hasAmbiguity) {
          state.hasAmbiguity = true;
        }
        searching = true;
        continue;
      }
    }
    if (instrumentalPhrase && isConWithPrep) {
      const baseSequences = objectSequences;
      const comitativeAlt = matchComitativePhraseAt(
        ir.tokens,
        modifierIndex,
        sourceLang,
        reflexivePossessiveOptions
      );
      let mainSequences = instrumentalPhrase.sequences;
      if (instrumentalPhrase.targetHumanity === "human" && comitativeAlt) {
        objectSequences = appendObjectSequences(baseSequences, comitativeAlt.sequences);
        const newSequences = appendObjectSequences(
          baseSequences,
          instrumentalPhrase.sequences
        );
        if (!instrumentalSequences) {
          instrumentalSequences = newSequences;
        } else {
          instrumentalSequences = [...instrumentalSequences, ...newSequences];
        }
        if (instrumentalPhrase.hasAmbiguity) {
          instrumentalHasAmbiguity = true;
        }
        mainSequences = comitativeAlt.sequences;
      } else {
        if (instrumentalPhrase.targetHumanity === "ambiguous" && comitativeAlt) {
          const comitativeHumanSequences = filterComitativeHumanSequences(
            comitativeAlt.sequences
          );
          if (comitativeHumanSequences.length > 0) {
            const newSequences = appendObjectSequences(
              baseSequences,
              comitativeHumanSequences
            );
            if (!instrumentalSequences) {
              instrumentalSequences = newSequences;
            } else {
              instrumentalSequences = [...instrumentalSequences, ...newSequences];
            }
          }
          if (comitativeAlt.hasAmbiguity) {
            instrumentalHasAmbiguity = true;
          }
        }
        if (instrumentalPhrase.targetHumanity === "ambiguous") {
          const nonHumanMain = filterInstrumentalNonHumanSequences(
            instrumentalPhrase.sequences
          );
          if (nonHumanMain.length > 0) {
            mainSequences = nonHumanMain;
          }
        }
        objectSequences = appendObjectSequences(baseSequences, mainSequences);
      }
      if (purposeSequences) {
        purposeSequences = appendObjectSequences(purposeSequences, mainSequences);
      }
      if (indirectSequences) {
        indirectSequences = appendObjectSequences(indirectSequences, mainSequences);
      }
      modifierConsumed += instrumentalPhrase.consumed;
      if (instrumentalPhrase.hasAmbiguity) {
        instrumentalHasAmbiguity = true;
      }
      searching = true;
      continue;
    }
    applyInstrumentalAlt(objectSequences);
    const comitativePhrase = matchComitativePhraseAt(
      ir.tokens,
      modifierIndex,
      sourceLang,
      reflexivePossessiveOptions
    );
    if (comitativePhrase) {
      objectSequences = appendObjectSequences(
        objectSequences,
        comitativePhrase.sequences
      );
      if (purposeSequences) {
        purposeSequences = appendObjectSequences(
          purposeSequences,
          comitativePhrase.sequences
        );
      }
      if (indirectSequences) {
        indirectSequences = appendObjectSequences(
          indirectSequences,
          comitativePhrase.sequences
        );
      }
      if (instrumentalSequences && !instrumentalPhrase) {
        instrumentalSequences = appendObjectSequences(
          instrumentalSequences,
          comitativePhrase.sequences
        );
      }
      modifierConsumed += comitativePhrase.consumed;
      if (comitativePhrase.hasAmbiguity) {
        state.hasAmbiguity = true;
      }
      searching = true;
      continue;
    }

    const allativePhrase = matchAllativePhraseAt(
      ir.tokens,
      modifierIndex,
      sourceLang,
      reflexivePossessiveOptions
    );
    if (allativePhrase) {
      objectSequences = appendObjectSequences(
        objectSequences,
        allativePhrase.sequences
      );
      if (purposeSequences) {
        purposeSequences = appendObjectSequences(
          purposeSequences,
          allativePhrase.sequences
        );
      }
      if (indirectSequences) {
        indirectSequences = appendObjectSequences(
          indirectSequences,
          allativePhrase.sequences
        );
      }
      if (instrumentalSequences && !instrumentalPhrase) {
        instrumentalSequences = appendObjectSequences(
          instrumentalSequences,
          allativePhrase.sequences
        );
      }
      modifierConsumed += allativePhrase.consumed;
      if (allativePhrase.hasAmbiguity) {
        state.hasAmbiguity = true;
      }
      hasAllative = true;
      searching = true;
      continue;
    }

    if (infinitiveMatch.match.entry.motionType === "motion") {
      const ablativePhrase = matchAblativePhraseAt(
        ir.tokens,
        modifierIndex,
        sourceLang,
        reflexivePossessiveOptions
      );
      if (ablativePhrase) {
        objectSequences = appendObjectSequences(
          objectSequences,
          ablativePhrase.sequences
        );
        if (purposeSequences) {
          purposeSequences = appendObjectSequences(
            purposeSequences,
            ablativePhrase.sequences
          );
        }
        if (indirectSequences) {
          indirectSequences = appendObjectSequences(
            indirectSequences,
            ablativePhrase.sequences
          );
        }
        if (instrumentalSequences && !instrumentalPhrase) {
          instrumentalSequences = appendObjectSequences(
            instrumentalSequences,
            ablativePhrase.sequences
          );
        }
        modifierConsumed += ablativePhrase.consumed;
        if (ablativePhrase.hasAmbiguity) {
          state.hasAmbiguity = true;
        }
        searching = true;
        continue;
      }
    }

    const locativePhrase = matchLocativePhraseAt(
      ir.tokens,
      modifierIndex,
      sourceLang,
      reflexivePossessiveOptions
    );
    if (locativePhrase) {
      objectSequences = appendObjectSequences(
        objectSequences,
        locativePhrase.sequences
      );
      if (purposeSequences) {
        purposeSequences = appendObjectSequences(
          purposeSequences,
          locativePhrase.sequences
        );
      }
      if (indirectSequences) {
        indirectSequences = appendObjectSequences(
          indirectSequences,
          locativePhrase.sequences
        );
      }
      if (instrumentalSequences && !instrumentalPhrase) {
        instrumentalSequences = appendObjectSequences(
          instrumentalSequences,
          locativePhrase.sequences
        );
      }
      modifierConsumed += locativePhrase.consumed;
      if (locativePhrase.hasAmbiguity) {
        state.hasAmbiguity = true;
      }
      searching = true;
    }

    const locativeMatch = matchLocativeMarkerAt(
      ir.tokens,
      modifierIndex,
      sourceLang
    );
    if (locativeMatch) {
      if (infinitiveMatch.match.entry.motionType === "motion") {
        const allativeMarker = matchAllativeMarkerAt(
          ir.tokens,
          modifierIndex,
          sourceLang
        );
        if (allativeMarker) {
          objectSequences = objectSequences.map((seq) => [
            ...seq,
            allativeMarker.part,
          ]);
          if (purposeSequences) {
            purposeSequences = purposeSequences.map((seq) => [
              ...seq,
              allativeMarker.part,
            ]);
          }
          if (indirectSequences) {
            indirectSequences = indirectSequences.map((seq) => [
              ...seq,
              allativeMarker.part,
            ]);
          }
          if (instrumentalSequences) {
            instrumentalSequences = instrumentalSequences.map((seq) => [
              ...seq,
              allativeMarker.part,
            ]);
          }
          modifierConsumed += allativeMarker.consumed;
          hasAllative = true;
          searching = true;
          continue;
        }
      }
      const locativePart = buildLocativePart(locativeMatch, sourceLang);
      objectSequences = objectSequences.map((seq) => [...seq, locativePart]);
      if (purposeSequences) {
        purposeSequences = purposeSequences.map((seq) => [
          ...seq,
          locativePart,
        ]);
      }
      if (indirectSequences) {
        indirectSequences = indirectSequences.map((seq) => [
          ...seq,
          locativePart,
        ]);
      }
      if (instrumentalSequences) {
        instrumentalSequences = instrumentalSequences.map((seq) => [
          ...seq,
          locativePart,
        ]);
      }
      modifierConsumed += locativeMatch.consumed;
      searching = true;
    }
    if (!searching && instrumentalPhrase && !instrumentalPhrase.isExclusive) {
      objectSequences = appendObjectSequences(
        objectSequences,
        instrumentalPhrase.sequences
      );
      if (purposeSequences) {
        purposeSequences = appendObjectSequences(
          purposeSequences,
          instrumentalPhrase.sequences
        );
      }
      if (indirectSequences) {
        indirectSequences = appendObjectSequences(
          indirectSequences,
          instrumentalPhrase.sequences
        );
      }
      modifierConsumed += instrumentalPhrase.consumed;
      if (instrumentalPhrase.hasAmbiguity) {
        instrumentalHasAmbiguity = true;
      }
      searching = true;
    }
  }
  objectConsumed += modifierConsumed;
  if (hasAllative) {
    infinitiveMatch = {
      ...infinitiveMatch,
      match: {
        ...infinitiveMatch.match,
        entry: resolveAllativeVerbEntry(infinitiveMatch.match.entry),
      },
    };
  }
  const nearFutureInfo = detectNearFutureEn(ir.tokens, index);
  const nearFuturePersons = lastSubjectPersons ?? lastVerbPersons ?? [];
  const allowNearFuture =
    Boolean(nearFutureInfo) && isAllowedNearFuturePersons(nearFuturePersons);
  const nearFutureStripSequences = allowNearFuture
    ? nearFutureInfo?.stripSequences ?? null
    : null;
  const nearFutureSubjectParts = hasSubjectPronounInCombos(state.combinations)
    ? []
    : helpers.buildImpliedSubjectParts(
        nearFuturePersons,
        state.lastSubject?.sourceToken
      );

  const parts = [
    ...subjectParts,
    createInfinitivePart(infinitiveMatch.match, sourceLang),
  ];
  const nearFutureParts = allowNearFuture
    ? [
        ...nearFutureSubjectParts,
        createVerbPart(
          infinitiveMatch.match,
          sourceLang,
          infinitiveMatch.match.entry.gupForms[0] ??
            infinitiveMatch.match.entry.gup,
          "VERB_NEAR_FUTURE_POS",
          infinitiveMatch.match.altGupForms?.[0]
            ? [infinitiveMatch.match.altGupForms[0]]
            : undefined
        ),
      ]
    : [];
  const branches = buildBranches(parts, objectSequences);
  const nearFutureBranches = allowNearFuture
    ? buildBranches(nearFutureParts, objectSequences)
    : [];
  const originBranches = originSequences
    ? buildBranches(parts, originSequences)
    : [];
  const purposeBranches = purposeSequences
    ? buildBranches(parts, purposeSequences)
    : [];
  const belongingPurposeBranches = belongingPurposeSequences
    ? buildBranches(parts, belongingPurposeSequences)
    : [];
  const belongingAboutBranches = belongingAboutSequences
    ? buildBranches(parts, belongingAboutSequences)
    : [];
  const aboutAltBranches = aboutAltSequences
    ? buildBranches(parts, aboutAltSequences)
    : [];
  const indirectBranches = indirectSequences
    ? buildBranches(parts, indirectSequences)
    : [];
  const instrumentalBranches = instrumentalSequences
    ? buildBranches(parts, instrumentalSequences)
    : [];
  if (branches.length === 0) {
    return { handled: false };
  }

  let expanded: TranslationResult["combinations"] = [];
  const baseGroupId = objectDropAmbiguity
    ? helpers.nextVariantGroup("dropdown")
    : null;
  const baseCombos = baseGroupId
    ? state.combinations.map((combo) => ({
        ...combo,
        variantGroup: baseGroupId,
      }))
    : state.combinations;
  for (const branch of branches) {
    expanded = expanded.concat(
      helpers.appendPartsToCombinations(baseCombos, branch, "dropdown")
    );
  }
  let expandedNearFuture: TranslationResult["combinations"] = [];
  if (nearFutureBranches.length > 0) {
    const nearFutureGroup = helpers.nextVariantGroup("box");
    const nearFutureCombos = filterNearFutureCombos(state.combinations).map(
      (combo) => ({
        ...combo,
        parts: stripTrailingSequences(combo.parts, nearFutureStripSequences),
        variantGroup: nearFutureGroup,
      })
    );
    for (const branch of nearFutureBranches) {
      expandedNearFuture = expandedNearFuture.concat(
        helpers.appendPartsToCombinations(nearFutureCombos, branch, "dropdown")
      );
    }
  }
  let expandedOrigin: TranslationResult["combinations"] = [];
  if (originBranches.length > 0) {
    const originGroup = helpers.nextVariantGroup("box");
    const originCombos = state.combinations.map((combo) => ({
      ...combo,
      variantGroup: originGroup,
    }));
    for (const branch of originBranches) {
      expandedOrigin = expandedOrigin.concat(
        helpers.appendPartsToCombinations(originCombos, branch, "dropdown")
      );
    }
  }
  let expandedPurpose: TranslationResult["combinations"] = [];
  if (purposeBranches.length > 0) {
    const purposeGroup = helpers.nextVariantGroup("box");
    const purposeCombos = state.combinations.map((combo) => ({
      ...combo,
      variantGroup: purposeGroup,
    }));
    for (const branch of purposeBranches) {
      expandedPurpose = expandedPurpose.concat(
        helpers.appendPartsToCombinations(purposeCombos, branch, "dropdown")
      );
    }
  }
  let expandedBelongingPurpose: TranslationResult["combinations"] = [];
  if (belongingPurposeBranches.length > 0) {
    const purposeGroup = helpers.nextVariantGroup("box");
    const purposeCombos = state.combinations.map((combo) => ({
      ...combo,
      variantGroup: purposeGroup,
    }));
    for (const branch of belongingPurposeBranches) {
      expandedBelongingPurpose = expandedBelongingPurpose.concat(
        helpers.appendPartsToCombinations(purposeCombos, branch, "dropdown")
      );
    }
  }
  let expandedBelongingAbout: TranslationResult["combinations"] = [];
  if (belongingAboutBranches.length > 0) {
    const aboutGroup = helpers.nextVariantGroup("box");
    const aboutCombos = state.combinations.map((combo) => ({
      ...combo,
      variantGroup: aboutGroup,
    }));
    for (const branch of belongingAboutBranches) {
      expandedBelongingAbout = expandedBelongingAbout.concat(
        helpers.appendPartsToCombinations(aboutCombos, branch, "dropdown")
      );
    }
  }
  let expandedAboutAlt: TranslationResult["combinations"] = [];
  if (aboutAltBranches.length > 0) {
    const altGroup = helpers.nextVariantGroup("box");
    const altCombos = state.combinations.map((combo) => ({
      ...combo,
      variantGroup: altGroup,
    }));
    for (const branch of aboutAltBranches) {
      expandedAboutAlt = expandedAboutAlt.concat(
        helpers.appendPartsToCombinations(altCombos, branch, "dropdown")
      );
    }
  }
  let expandedIndirect: TranslationResult["combinations"] = [];
  if (indirectBranches.length > 0) {
    const indirectGroup = helpers.nextVariantGroup("box");
    const indirectCombos = state.combinations.map((combo) => ({
      ...combo,
      variantGroup: indirectGroup,
    }));
    for (const branch of indirectBranches) {
      expandedIndirect = expandedIndirect.concat(
        helpers.appendPartsToCombinations(indirectCombos, branch, "dropdown")
      );
    }
  }
  let expandedInstrumental: TranslationResult["combinations"] = [];
  if (instrumentalBranches.length > 0) {
    const instrumentalGroup = helpers.nextVariantGroup("box");
    const instrumentalCombos = state.combinations.map((combo) => ({
      ...combo,
      parts: stripTrailingSequences(combo.parts, objectSequences),
      variantGroup: instrumentalGroup,
    }));
    for (const branch of instrumentalBranches) {
      expandedInstrumental = expandedInstrumental.concat(
        helpers.appendPartsToCombinations(instrumentalCombos, branch, "dropdown")
      );
    }
  }
  if (branches.length > 1) {
    state.hasAmbiguity = true;
  }
  if (
    expandedOrigin.length > 0 ||
    expandedNearFuture.length > 0 ||
    expandedPurpose.length > 0 ||
    expandedBelongingPurpose.length > 0 ||
    expandedBelongingAbout.length > 0 ||
    expandedAboutAlt.length > 0 ||
    expandedIndirect.length > 0 ||
    expandedInstrumental.length > 0 ||
    originHasAmbiguity ||
    purposeHasAmbiguity ||
    belongingPurposeHasAmbiguity ||
    belongingAboutHasAmbiguity ||
    aboutAltHasAmbiguity ||
    indirectHasAmbiguity ||
    instrumentalHasAmbiguity
  ) {
    state.hasAmbiguity = true;
  }
  state.combinations = [
    ...expanded,
    ...expandedNearFuture,
    ...expandedOrigin,
    ...expandedPurpose,
    ...expandedBelongingPurpose,
    ...expandedBelongingAbout,
    ...expandedAboutAlt,
    ...expandedIndirect,
    ...expandedInstrumental,
  ];
  const connectorAnchor = index + verbConsumed + objectConsumed;
  state.lastConnectorAnchor = connectorAnchor;
  return { handled: true, nextIndex: connectorAnchor };
}
