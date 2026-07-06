import type { LanguageMode } from "@/app/components/types/components.type";
import type {
  PersonNumber,
  TranslationPart,
  TranslationResult,
  VariantScope,
} from "../core/types";
import type { PendingObject } from "../logic/objects";
import type { ModalMatch } from "../logic/modal";
import type { TokenLike } from "../logic/tokenUtils";

export type SubjectContext = {
  persons?: PersonNumber[];
  sourceToken?: string;
  startIndex?: number;
  endIndex: number;
  kind?: "pronoun" | "noun" | "unknown";
  nounIndices?: number[];
  isHuman?: boolean;
  posture?: "lying" | "standing";
};

export type TranslateState = {
  get combinations(): TranslationResult["combinations"];
  set combinations(value: TranslationResult["combinations"]);
  get hasAmbiguity(): boolean;
  set hasAmbiguity(value: boolean);
  get lastSubject(): SubjectContext | null;
  set lastSubject(value: SubjectContext | null);
  get lastVerbSubject(): SubjectContext | null;
  set lastVerbSubject(value: SubjectContext | null);
  get pendingObject(): PendingObject | null;
  set pendingObject(value: PendingObject | null);
  get pendingObjectIndex(): number | null;
  set pendingObjectIndex(value: number | null);
  get lastConnectorAnchor(): number | null;
  set lastConnectorAnchor(value: number | null);
  get pendingSubjectJoin(): boolean;
  set pendingSubjectJoin(value: boolean);
  skipIndices: Set<number>;
};

export type TranslateHelpers = {
  appendPartsToCombinations: (
    combos: TranslationResult["combinations"],
    parts: TranslationPart[],
    scope?: VariantScope
  ) => TranslationResult["combinations"];
  buildImpliedSubjectParts: (
    persons: PersonNumber[] | null,
    sourceToken?: string
  ) => TranslationPart[];
  updateLastVerbSubject: (
    persons: PersonNumber[] | null,
    endIndex: number,
    sourceToken?: string
  ) => void;
  getSubjectPersons: (subject?: SubjectContext | null) => PersonNumber[] | null;
  getSubjectEndIndex: (subject?: SubjectContext | null) => number | null;
  hasImmediateSubject: (
    subject: SubjectContext | null,
    verbIndex: number,
    pending?: PendingObject | null
  ) => boolean;
  buildModalBranches: (
    modal: ModalMatch,
    subjectParts: TranslationPart[],
    objectSequences: TranslationPart[][],
    negated: boolean,
    negatorSource?: string
  ) => TranslationPart[][];
  maybeApplyAgentSuffix: (isTransitive: boolean, hasExplicitSubject: boolean) => void;
  hasExclamation: (tokens: TokenLike[], start: number, consumed: number) => boolean;
  nextVariantGroup: (scope: VariantScope) => { scope: VariantScope; id: string };
};

export type VerbHandlerResult = {
  handled: boolean;
  hasVerbMatch: boolean;
  nextIndex?: number;
};

export type TranslateContext = {
  sourceLang: LanguageMode;
};
