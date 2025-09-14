# CUDA Setup Guide for DiFix Model

## **Quick Answer: Do I Need CUDA?**

**NO, CUDA is NOT required!** The DiFix model will work on CPU, but here are the trade-offs:

| Setup             | Speed                  | Quality | Memory Usage | Setup Complexity |
| ----------------- | ---------------------- | ------- | ------------ | ---------------- |
| **CPU Only**      | Slow (2-5 min/image)   | Same    | 8-16 GB RAM  | ✅ Simple        |
| **GPU with CUDA** | Fast (10-30 sec/image) | Same    | 6-12 GB VRAM | ⚠️ Complex       |

## **Current Status of Your System**

Based on your error messages:

- ✅ **DiFix model downloaded successfully** (10.3GB)
- ❌ **PyTorch not compiled with CUDA** (CPU-only version)
- ✅ **Fixed: trust_remote_code issue** (handled automatically now)

## **Option 1: Use CPU Only (Recommended for Testing)**

**Pros:**

- ✅ Works immediately with current setup
- ✅ No additional installation required
- ✅ Same image quality

**Cons:**

- ⏱️ Slower generation (2-5 minutes per image)
- 🐏 Higher RAM usage

**To use CPU-only:** No changes needed! The updated code automatically detects and uses CPU.

## **Option 2: Install CUDA Support (For Production)**

### **Step 1: Check Your GPU**

```bash
# Windows
nvidia-smi

# Or check in Device Manager > Display adapters
```

**Requirements:**

- NVIDIA GPU with 6GB+ VRAM (RTX 3060, RTX 4060, or better)
- Compatible CUDA version

### **Step 2: Install CUDA Toolkit**

**Windows:**

1. Download from: https://developer.nvidia.com/cuda-downloads
2. Choose: Windows > x86_64 > Version > exe (local)
3. Install with default settings

**Verify installation:**

```bash
nvcc --version
nvidia-smi
```

### **Step 3: Install GPU-Enabled PyTorch**

**Uninstall current PyTorch:**

```bash
pip uninstall torch torchvision torchaudio
```

**Install GPU version:**

```bash
# For CUDA 11.8 (most common)
pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu118

# For CUDA 12.1 (newer GPUs)
pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu121
```

**Verify GPU support:**

```python
import torch
print(f"CUDA available: {torch.cuda.is_available()}")
print(f"GPU count: {torch.cuda.device_count()}")
if torch.cuda.is_available():
    print(f"GPU name: {torch.cuda.get_device_name(0)}")
```

## **Updated System Architecture**

The code now handles both scenarios automatically:

```python
# Automatic detection and fallback
cuda_available = torch.cuda.is_available() and torch.cuda.device_count() > 0

if cuda_available:
    # Use GPU with float16 for efficiency
    pipe = DiffusionPipeline.from_pretrained("nvidia/difix", torch_dtype=torch.float16)
    pipe.to("cuda")
else:
    # Use CPU with float32 for compatibility
    pipe = DiffusionPipeline.from_pretrained("nvidia/difix", torch_dtype=torch.float32)
```

## **Testing Your Setup**

Run the updated test script:

```bash
python test_difix.py
```

**Expected Output (CPU):**

```
🔍 System Diagnostics
PyTorch Version: 2.x.x
CUDA Available: False
📋 Recommendations:
  • No CUDA support detected - will use CPU (slower but functional)
  • To enable GPU: install CUDA toolkit and GPU-enabled PyTorch

ℹ️  Using CPU for DiFix generation
✅ SUCCESS: Image generated and saved
```

**Expected Output (GPU):**

```
🔍 System Diagnostics
PyTorch Version: 2.x.x+cu118
CUDA Available: True
GPU: NVIDIA GeForce RTX 4060
GPU Memory: 8.0 GB
📋 Recommendations:
  • GPU has sufficient VRAM for optimal DiFix performance

✅ Using GPU for DiFix generation
✅ SUCCESS: Image generated and saved
```

## **Troubleshooting**

### **"Torch not compiled with CUDA enabled"**

- **Solution**: You have CPU-only PyTorch. Follow Option 2 above or continue with CPU.

### **"CUDA out of memory"**

```python
# Reduce memory usage
pipe = DiffusionPipeline.from_pretrained(
    "nvidia/difix",
    torch_dtype=torch.float16,
    low_cpu_mem_usage=True
)
```

### **"trust_remote_code" Error**

- **Solution**: Already fixed in updated code with `trust_remote_code=True`

### **Model Download Issues**

```bash
# Clear Hugging Face cache and retry
rm -rf ~/.cache/huggingface/transformers/
# or on Windows
rmdir /s "%USERPROFILE%\.cache\huggingface\transformers"
```

## **Recommendations**

### **For Development/Testing:**

- ✅ **Use CPU** - simpler setup, works immediately
- ⏱️ Accept slower generation times
- 🧪 Perfect for testing the pipeline

### **For Production:**

- 🚀 **Use GPU** - much faster
- 💰 Consider cloud GPU instances if local GPU unavailable
- 📊 Monitor VRAM usage

### **Cloud Alternatives:**

- **Google Colab** (Free GPU for testing)
- **AWS/Azure/GCP** (Production GPU instances)
- **RunPod/Vast.ai** (Cheaper GPU rentals)

## **Memory Requirements**

| Component         | CPU RAM    | GPU VRAM  |
| ----------------- | ---------- | --------- |
| DiFix Model       | ~12 GB     | ~6 GB     |
| MiDaS Model       | ~2 GB      | ~1 GB     |
| Processing Buffer | ~4 GB      | ~2 GB     |
| **Total**         | **~18 GB** | **~9 GB** |

**Minimum Requirements:**

- CPU: 16 GB RAM (with swap file)
- GPU: 8 GB VRAM (RTX 3070/4060 or better)

## **Next Steps**

1. **Test current setup** (CPU): `python test_difix.py`
2. **If satisfied with speed**: Continue with CPU
3. **If need faster generation**: Install CUDA + GPU PyTorch
4. **For production**: Consider cloud GPU instances

The system is fully functional right now with CPU - GPU is just an optimization! 🚀
