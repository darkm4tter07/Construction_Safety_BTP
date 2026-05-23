# Construction_Safety_BTP

This project is a real-time safety monitoring that detects PPE compliance and unsafe postures of construction workers using computer vision models.  
It combines **YOLO** for PPE detection, **MediaPipe** for pose estimation, and ergonomic analysis (RULA/REBA) for posture risk evaluation.

## === AI Backend Server Setup (Ubuntu 24.04) ===

Requirements:
- Ubuntu 24.04 LTS
- NVIDIA GPU with CUDA 12.4+ drivers
- Python 3.12 (built-in with Ubuntu 24.04)

Step 1: System dependencies
  sudo apt update
  sudo apt install -y python3-venv python3-pip libgl1 libglib2.0-0 libglib2.0-dev

Step 2: Create & activate virtual environment
  cd Construction_Safety_BTP/Backend
  python3 -m venv venv
  source venv/bin/activate

Step 3: Set temp directory (prevents disk quota error on large downloads)
  mkdir -p ~/tmp-pip
  export TMPDIR=~/tmp-pip

Step 4: Install PyTorch with GPU support (do this separately first)
  pip install torch==2.6.0+cu124 torchvision==0.21.0+cu124 torchaudio==2.6.0+cu124 \
    --index-url https://download.pytorch.org/whl/cu124 \
    --cache-dir ~/pip-cache

Step 5: Install remaining dependencies
  pip install -r requirements.txt --cache-dir ~/pip-cache

Step 6: Start the server
  uvicorn app.main:app --reload

Note: Activate venv every time before running:
  source venv/bin/activate