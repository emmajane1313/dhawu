---
language:
  - guf
license: cc-by-nc-sa-4.0
library_name: piper
pipeline_tag: text-to-speech
tags:
  - text-to-speech
  - piper
  - vits
  - onnx
  - gupapuyngu
  - yolngu
  - australian-languages
  - low-resource
---

# Gupapuyŋu TTS (Piper / VITS)

A neural text-to-speech model for **Gupapuyŋu** (Yolŋu Matha, north-east Arnhem Land, Australia; ISO 639-3 `guf`).
To our knowledge this is the first open TTS model for the language ([on-chain record, 17 Sep 2026](https://etherscan.io/tx/0x0ee9f30a239a85c553dbeacf8fddf6081ed8713e74c163c79fda7d7d18c559e9)).

The model takes standard Gupapuyŋu orthography (`ŋ`, `ä`, `ḏ ṯ ṉ ḻ`, `'` glottal stop, `dj tj ny`) and produces 22 050 Hz speech in one of **three synthetic voices**. None of them is a real person.

## Files

| file | what |
|---|---|
| `gup_multi.onnx` | the three-voice model (Piper "medium" VITS, multi-speaker, ~77 MB) |
| `gup_multi.onnx.json` | Piper config: phoneme → id map, `speaker_id_map`, sample rate, inference scales |
| `espeak-gup/` | the espeak-ng language definition (`lang-gup`, `gup_rules`, `gup_list`) that turns orthography into phonemes — **required**, Piper phonemizes through espeak-ng |
| `sintetizar.py` | minimal synthesizer (espeak-ng + onnxruntime, no piper-tts needed — works on Linux, macOS Intel/Apple Silicon and Windows) |
| `train_kaggle.ipynb` / `train_multi_kaggle.ipynb` | the Kaggle training notebooks (single-voice fine-tune, then multi-speaker resume) — bring your own data, see *Training* |

## The three voices

| `--hablante` | mean f0 | character |
|---|---|---|
| `mali.wata` | ≈ 251 Hz | highest and most melodic; widest intonation range, cleanest signal |
| `mali.walu` | ≈ 246 Hz | high and steady; clear, even timbre, most comfortable on long sentences |
| `mali.munha` | ≈ 215 Hz | lowest and calmest; soft, warm reading voice |

*mali* — image, shadow; *wata* — wind; *walu* — sun; *munha* — night.

## Quick start

1. Install espeak-ng (Linux: `apt install espeak-ng` · macOS: `brew install espeak-ng` · Windows: the `.msi` installer from the espeak-ng releases) and add the `gup` language.

Linux / macOS:

```bash
DATA=$(espeak-ng --version | sed -n 's/.*Data at: *//p')
mkdir -p "$DATA/lang/aus"
cp espeak-gup/lang-gup "$DATA/lang/aus/gup"
cd espeak-gup && espeak-ng --compile=gup && cd ..
espeak-ng -v gup --ipa "Dhuwala ŋarraku wäŋa"
```

Windows (PowerShell as administrator; add `C:\Program Files\eSpeak NG` to `PATH`):

```powershell
$DATA = "C:\Program Files\eSpeak NG\espeak-ng-data"
New-Item -ItemType Directory -Force "$DATA\lang\aus" | Out-Null
Copy-Item espeak-gup\lang-gup "$DATA\lang\aus\gup"
cd espeak-gup; espeak-ng --compile=gup; cd ..
espeak-ng -v gup --ipa "Dhuwala ŋarraku wäŋa"
```

2. Synthesize (Python 3.10+, identical on all three systems):

```bash
pip install onnxruntime "numpy<2"
python sintetizar.py "Dhuwala ŋarraku wäŋa. Ŋarra dhu marrtji Galiwin'kulili." --modelo gup_multi.onnx --hablante mali.munha --salida hola.wav
```

`--hablante` takes `mali.wata`, `mali.walu` or `mali.munha` (default: `mali.wata`). `--duracion 1.1` slows the speech down, `0.9` speeds it up. `noise_scale` / `noise_w` in the `.json` control how much the intonation varies.

Or with Piper itself (Linux): copy `lang-gup` and the compiled `gup_dict` into piper-phonemize's `espeak-ng-data/`, then `piper --model gup_multi.onnx --speaker 2`.

## Training

- Architecture: Piper VITS, quality **medium** (192 hidden channels, 6 encoder layers).
- Fine-tuned from `en_US-lessac-medium` (epoch 2164) — the English weights are only a starting point; the phoneme inventory is Gupapuyŋu's, via the custom espeak-ng language.
- Data: **2 336 utterances, ~163 minutes**, 22 050 Hz mono, all utterances ≤ ~23 s. Text ↔ audio pairing was done **entirely by hand**; automatic forced alignment was tried first and rejected as too error-prone for this language.
- Batch 8, fp32, one T4, 5-hour cycles on Kaggle.
- Multi-speaker stage: training resumed from the single-speaker checkpoint with `--resume_from_single_speaker_checkpoint`, batch 8, ~5 h on a T4.

### Reproducing / training your own

The notebooks `train_kaggle.ipynb` and `train_multi_kaggle.ipynb` are the exact pipelines used, ready for Kaggle (T4). **The training data is not distributed.** To run them, upload your own dataset in this layout:

```
dataset/
  metadata.csv        # id|text          (single)   or   id|speaker|text   (multi), UTF-8, no header
  wavs/<id>.wav       # 22050 Hz, mono, 16-bit PCM, ideally 1–20 s
espeak-gup/           # lang-gup, gup_rules, gup_list (from this repository)
```

zipped as `gup_dataset.zip` (single) or `gup_multi.zip` (multi) and added as a Kaggle dataset input. Text must use the standard orthography above.

Future releases of this model will be trained on fully synthetic data, so that the training set itself can be published alongside the weights; the current set is withheld for privacy reasons.

## Limitations

- Reading register; expect flatter prosody on long or complex sentences.
- Words with sound sequences absent from the training text may be mispronounced.
- Releases exported before the `apostrophe 2` option was added to `lang-gup` were trained without the word-final glottal stop (`ŋama'`); later releases include it.

## Credits

Voice model, labelling and espeak-ng language: Emma-Jane MacKinnon-Lee (DIGITALAX) — built for the Dhäwu Gupapuyŋu learning site.
Piper by Michael Hansen (rhasspy), MIT. Base checkpoint `en_US-lessac-medium` from rhasspy/piper-checkpoints.
