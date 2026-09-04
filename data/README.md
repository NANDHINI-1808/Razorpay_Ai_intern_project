# PayShield AI — Dataset

**GENUINE HELD-OUT TEST DATA NOT AVAILABLE.**

There is no `training/`, `validation/`, or `test/` split in this
directory, and there will not be one added artificially. Creating those
folder names and copying the same 28 synthetic transactions into each
would misrepresent a single reused dataset as a genuine three-way split —
exactly what this project's evaluation methodology explicitly avoids
doing. See `docs/MODEL_EVALUATION.md` for the full, honest explanation.

## What actually exists

A single synthetic dataset of 28 transactions, generated deterministically
(seeded PRNG) at application start in `frontend/src/services/mockData.ts`.
This same dataset is:

1. Used to populate the live product UI (transactions, investigations, audit logs, analytics)
2. Reused, with a separately-generated synthetic ground-truth fraud label, for the Model Performance evaluation in Analytics

Both uses are clearly disclosed in-app as **"Synthetic / Demo Dataset."**

## What a real deployment would need here

- A genuine training set of labeled historical transactions
- A genuine validation set for threshold/hyperparameter selection, disjoint from training
- A genuine held-out test set of confirmed fraud/legitimate outcomes (e.g. from chargebacks, confirmed disputes, or merchant-verified legitimate transactions), never used for training or threshold tuning, used only to report final metrics

None of that exists in this build. This file exists so that gap is
visible in the repository itself, not just in a report.
