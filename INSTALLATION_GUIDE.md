# 🔧 Installation Guide

## Complete Setup Instructions for Windows, Mac, and Linux

---

## 📋 Prerequisites

Before starting, ensure you have:
- A computer with internet connection
- Administrator/sudo access
- At least 500 MB free disk space

---

## 🪟 Windows Installation

### Step 1: Install Python

1. **Download Python**
   - Go to: https://www.python.org/downloads/
   - Click "Download Python 3.x.x" (latest version)

2. **Run Installer**
   - Double-click the downloaded file
   - ⚠️ **IMPORTANT**: Check "Add Python to PATH"
   - Click "Install Now"
   - Wait for installation to complete

3. **Verify Installation**
   - Open Command Prompt (Win + R, type `cmd`, press Enter)
   - Type: `python --version`
   - Should show: `Python 3.x.x`

### Step 2: Install Required Libraries

Open Command Prompt and run:

```bash
pip install pandas numpy matplotlib seaborn jupyter
```

Or use the requirements file:

```bash
cd path\to\project\folder
pip install -r requirements.txt
```

### Step 3: Launch Jupyter Notebook

```bash
jupyter notebook
```

This will open Jupyter in your default web browser.

---

## 🍎 Mac Installation

### Step 1: Install Python

**Option A: Using Homebrew (Recommended)**

1. **Install Homebrew** (if not installed)
   ```bash
   /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
   ```

2. **Install Python**
   ```bash
   brew install python
   ```

**Option B: Download from Python.org**
- Go to: https://www.python.org/downloads/mac-osx/
- Download and install the latest version

### Step 2: Verify Installation

Open Terminal and run:
```bash
python3 --version
```

### Step 3: Install Required Libraries

```bash
pip3 install pandas numpy matplotlib seaborn jupyter
```

Or:
```bash
cd /path/to/project/folder
pip3 install -r requirements.txt
```

### Step 4: Launch Jupyter Notebook

```bash
jupyter notebook
```

---

## 🐧 Linux Installation

### Step 1: Install Python

**Ubuntu/Debian:**
```bash
sudo apt update
sudo apt install python3 python3-pip
```

**Fedora:**
```bash
sudo dnf install python3 python3-pip
```

**Arch Linux:**
```bash
sudo pacman -S python python-pip
```

### Step 2: Verify Installation

```bash
python3 --version
pip3 --version
```

### Step 3: Install Required Libraries

```bash
pip3 install pandas numpy matplotlib seaborn jupyter
```

Or:
```bash
cd /path/to/project/folder
pip3 install -r requirements.txt
```

### Step 4: Launch Jupyter Notebook

```bash
jupyter notebook
```

---

## 🔍 Troubleshooting

### Problem 1: "python is not recognized"

**Windows:**
- Python not added to PATH
- Solution: Reinstall Python and check "Add Python to PATH"

**Mac/Linux:**
- Use `python3` instead of `python`
- Use `pip3` instead of `pip`

---

### Problem 2: "pip is not recognized"

**Windows:**
```bash
python -m pip install --upgrade pip
```

**Mac/Linux:**
```bash
python3 -m pip install --upgrade pip
```

---

### Problem 3: "Permission denied" (Mac/Linux)

Use `--user` flag:
```bash
pip3 install --user pandas numpy matplotlib seaborn jupyter
```

Or use `sudo` (not recommended):
```bash
sudo pip3 install pandas numpy matplotlib seaborn jupyter
```

---

### Problem 4: "jupyter command not found"

**Solution 1: Add to PATH**

**Windows:**
```bash
python -m jupyter notebook
```

**Mac/Linux:**
```bash
python3 -m jupyter notebook
```

**Solution 2: Reinstall Jupyter**
```bash
pip install --upgrade jupyter
```

---

### Problem 5: Slow installation

**Use a mirror:**
```bash
pip install -i https://pypi.tuna.tsinghua.edu.cn/simple pandas numpy matplotlib seaborn jupyter
```

---

### Problem 6: SSL Certificate Error

**Windows:**
```bash
pip install --trusted-host pypi.org --trusted-host files.pythonhosted.org pandas numpy matplotlib seaborn jupyter
```

---

## ✅ Verify Installation

Create a test file `test_installation.py`:

```python
import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns

print("✅ Pandas version:", pd.__version__)
print("✅ NumPy version:", np.__version__)
print("✅ Matplotlib version:", plt.matplotlib.__version__)
print("✅ Seaborn version:", sns.__version__)
print("\n🎉 All libraries installed successfully!")
```

Run it:
```bash
python test_installation.py
```

Expected output:
```
✅ Pandas version: 1.x.x
✅ NumPy version: 1.x.x
✅ Matplotlib version: 3.x.x
✅ Seaborn version: 0.x.x

🎉 All libraries installed successfully!
```

---

## 🚀 Quick Start After Installation

1. **Download/Extract the project**

2. **Open Terminal/Command Prompt**

3. **Navigate to project folder**
   ```bash
   cd path/to/Online-Food-Delivery-Analysis
   ```

4. **Launch Jupyter**
   ```bash
   jupyter notebook
   ```

5. **Open the notebook**
   - Click on `Online_Food_Delivery_Analysis.ipynb`

6. **Run all cells**
   - Click: `Cell` → `Run All`

---

## 📦 Alternative: Using Anaconda

Anaconda includes Python, Jupyter, and all required libraries.

### Step 1: Download Anaconda
- Go to: https://www.anaconda.com/download
- Download for your operating system
- Install (takes 5-10 minutes)

### Step 2: Launch Jupyter
- Open Anaconda Navigator
- Click "Launch" under Jupyter Notebook

### Step 3: Navigate to Project
- Browse to project folder
- Open `Online_Food_Delivery_Analysis.ipynb`

**Advantage:** No need to install individual libraries!

---

## 🐳 Alternative: Using Google Colab (No Installation)

If you can't install locally, use Google Colab:

### Step 1: Upload Files
1. Go to: https://colab.research.google.com/
2. Click: `File` → `Upload notebook`
3. Upload `Online_Food_Delivery_Analysis.ipynb`

### Step 2: Upload Dataset
```python
from google.colab import files
uploaded = files.upload()
# Upload food_delivery.csv
```

### Step 3: Modify Path
Change:
```python
df = pd.read_csv('dataset/food_delivery.csv')
```

To:
```python
df = pd.read_csv('food_delivery.csv')
```

### Step 4: Run All Cells
- Click: `Runtime` → `Run all`

**Advantage:** Works on any device with internet!

---

## 💻 IDE Alternatives to Jupyter

### 1. VS Code
- Install Python extension
- Install Jupyter extension
- Open `.ipynb` files directly

### 2. PyCharm
- Professional IDE
- Supports Jupyter notebooks
- Great for debugging

### 3. Spyder
- Comes with Anaconda
- MATLAB-like interface
- Good for data science

---

## 📊 System Requirements

### Minimum:
- **OS**: Windows 7+, macOS 10.12+, Linux
- **RAM**: 2 GB
- **Storage**: 500 MB
- **Python**: 3.6+

### Recommended:
- **OS**: Windows 10+, macOS 11+, Ubuntu 20.04+
- **RAM**: 4 GB+
- **Storage**: 1 GB
- **Python**: 3.8+

---

## 🔄 Updating Libraries

To update all libraries:

```bash
pip install --upgrade pandas numpy matplotlib seaborn jupyter
```

To update specific library:

```bash
pip install --upgrade pandas
```

---

## 🗑️ Uninstallation

To remove libraries:

```bash
pip uninstall pandas numpy matplotlib seaborn jupyter
```

To remove Python:
- **Windows**: Control Panel → Programs → Uninstall
- **Mac**: Delete from Applications
- **Linux**: `sudo apt remove python3`

---

## 📞 Getting Help

### Official Documentation:
- Python: https://docs.python.org/
- Pandas: https://pandas.pydata.org/docs/
- Matplotlib: https://matplotlib.org/stable/contents.html
- Seaborn: https://seaborn.pydata.org/
- Jupyter: https://jupyter-notebook.readthedocs.io/

### Community Support:
- Stack Overflow: https://stackoverflow.com/
- Reddit: r/learnpython
- Python Discord: https://discord.gg/python

---

## ✅ Installation Checklist

- [ ] Python installed
- [ ] Python added to PATH
- [ ] pip working
- [ ] Pandas installed
- [ ] NumPy installed
- [ ] Matplotlib installed
- [ ] Seaborn installed
- [ ] Jupyter installed
- [ ] Jupyter launches successfully
- [ ] Test script runs without errors
- [ ] Project files downloaded
- [ ] Dataset file present

---

## 🎉 Success!

If you've completed all steps, you're ready to run the project!

**Next Steps:**
1. Read `QUICK_START_GUIDE.md`
2. Open the Jupyter Notebook
3. Run all cells
4. Explore the analysis

---

**Happy Coding! 🚀**
