#!/usr/bin/env bash

set -euo pipefail

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$PROJECT_ROOT"

echo "========================================"
echo " LabelLens setup"
echo "========================================"

# --------------------------------------------------
# 1. Check Python
# --------------------------------------------------

if ! command -v python3 >/dev/null 2>&1; then
    echo "ERROR: Python 3 is required."
    exit 1
fi

echo
echo "[1/5] Python"
python3 --version

# --------------------------------------------------
# 2. Create Python virtual environment
# --------------------------------------------------

echo
echo "[2/5] Setting up Python environment"

if [ ! -d ".venv" ]; then
    python3 -m venv .venv
    echo "Created .venv"
else
    echo ".venv already exists"
fi

source .venv/bin/activate

python -m pip install --upgrade pip
python -m pip install -r backend/requirements.txt

# --------------------------------------------------
# 3. Check Node.js / npm
# --------------------------------------------------

echo
echo "[3/5] Checking Node.js"

if ! command -v node >/dev/null 2>&1 || ! command -v npm >/dev/null 2>&1; then
    echo
    echo "ERROR: Node.js and npm are required for the LabelLens frontend."
    echo
    echo "Install Node.js 20+ and npm, then run:"
    echo
    echo "  ./setup.sh"
    echo
    exit 1
fi

node --version
npm --version

# --------------------------------------------------
# 4. Install frontend dependencies
# --------------------------------------------------

echo
echo "[4/5] Installing frontend dependencies"

cd "$PROJECT_ROOT/frontend"
npm ci

cd "$PROJECT_ROOT"

# --------------------------------------------------
# 5. Initialize / ingest dataset
# --------------------------------------------------

echo
echo "[5/5] Checking Charades dataset"

CHARADES_DIR="$PROJECT_ROOT/data/raw/charades"

REQUIRED_FILES=(
    "Charades_v1_train.csv"
    "Charades_v1_classes.txt"
    "Charades_v1_objectclasses.txt"
)

DATASET_READY=true

for file in "${REQUIRED_FILES[@]}"; do
    if [ ! -f "$CHARADES_DIR/$file" ]; then
        DATASET_READY=false
        break
    fi
done

if [ "$DATASET_READY" = true ]; then
    echo "Charades annotation files found."
    echo "Running database ingestion..."

    python "$PROJECT_ROOT/scripts/ingest_charades.py"

    echo
    echo "Database ingestion completed."
else
    echo
    echo "WARNING: Charades annotation files were not found."
    echo
    echo "Expected:"
    for file in "${REQUIRED_FILES[@]}"; do
        echo "  data/raw/charades/$file"
    done
    echo
    echo "Skipping database ingestion."
    echo "See README.md for dataset setup instructions."
fi

echo
echo "========================================"
echo " Setup complete"
echo "========================================"
echo
echo "Start LabelLens with:"
echo
echo "  ./run.sh"
echo
