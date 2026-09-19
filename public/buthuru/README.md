# Gupapuyŋu TTS dataset (built with Buthuru)

Everything in this zip was produced locally in the browser. No audio or text left the machine.

## Layout

```
dataset/
  metadata.csv            id|text   (pipe separated, one line per clip, UTF-8, no header)
  wavs/<id>.wav           16-bit PCM mono, 22050 Hz
espeak-gup/
  lang-gup                espeak-ng language file
  gup_rules               grapheme -> phoneme rules
  gup_list                exceptions list
train_kaggle.ipynb        single voice fine-tune (Piper / VITS)
train_multi_kaggle.ipynb  multi voice fine-tune
```

## Kaggle

1. Kaggle → Datasets → New Dataset. Name it `gup-dataset` and upload this zip as-is (`gup_dataset.zip`).
2. Kaggle → Code → New Notebook → File → Import Notebook → `train_kaggle.ipynb` (or `train_multi_kaggle.ipynb`).
3. Session options: Accelerator = GPU T4 x2 (or P100), Internet = ON. Add Input → your `gup-dataset`.
4. Save Version → Save & Run All. Each cycle trains for about 4 h 45 min and stops itself.
5. Outputs: `gup-checkpoint.tar`, `gup.onnx`, `gup.onnx.json`. To keep training, upload `gup-checkpoint.tar` as a Kaggle dataset named `gup-checkpoint`, attach it as a second input and run again.

## Using the exported model

```
pip install piper-tts
echo "ŋarra ga marrtji" | piper --model gup.onnx --output_file salida.wav
```

`espeak-gup` must be compiled into the espeak-ng data directory first (cells 3 and 5 of the notebook show the exact commands).
