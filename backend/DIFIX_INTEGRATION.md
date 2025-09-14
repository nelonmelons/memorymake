# NVIDIA DiFix Integration Guide

## Overview

This document explains the integration of NVIDIA's DiFix model into the 2D-to-3D pipeline. DiFix is a state-of-the-art diffusion model designed for high-quality image generation with better detail preservation and color accuracy.

## What is DiFix?

DiFix (Diffusion Fix) is NVIDIA's advanced diffusion model that provides:

- **Higher quality image generation** compared to standard Stable Diffusion
- **Better detail preservation** especially for complex scenes
- **Improved color accuracy** and consistency
- **Optimized inference speed** with fewer denoising steps required

## Integration Details

### 1. New Functions Added

#### `generate_image_difix(prompt, style, save_path)`

- Primary function for DiFix image generation
- Optimized for panoramic 2D-to-3D conversion
- Includes automatic fallback to SDXL if DiFix fails

#### `generate_image_with_model_selection(prompt, style, save_path, model)`

- Universal function that supports multiple models
- Models supported: "difix", "sdxl", "sdxl_api"
- Provides flexibility for different use cases

### 2. API Enhancements

The `/generate` endpoint now accepts an optional `model` parameter:

```json
{
  "prompt": "A serene mountain landscape",
  "style": "photorealistic",
  "model": "difix" // Optional, defaults to "difix"
}
```

**Supported Models:**

- `"difix"` - NVIDIA DiFix (default)
- `"sdxl"` - Local Stable Diffusion XL
- `"sdxl_api"` - HuggingFace API SDXL

### 3. Optimizations for 3D Pipeline

The DiFix integration includes specific optimizations for 2D-to-3D conversion:

```python
# Enhanced prompt for 3D conversion
base_prompt = "A 180-degree panoramic view with clear, layered depth..."

# DiFix-specific quality enhancements
difix_optimizations = ", detailed, 8k, high quality, sharp focus, clear details"

# Optimized parameters
num_inference_steps=30  # DiFix needs fewer steps
guidance_scale=7.0      # Slightly lower for DiFix
```

### 4. Fallback Mechanism

If DiFix model fails to load or generate:

1. Error is logged
2. Automatic fallback to local SDXL
3. User notification of fallback
4. Pipeline continues seamlessly

## Installation & Setup

### 1. Install Dependencies

```bash
pip install diffusers==0.31.0 transformers==4.46.3 accelerate==1.2.1
```

### 2. Test Integration

Run the test script to verify everything works:

```bash
python test_difix.py
```

### 3. GPU Requirements

- **Recommended**: NVIDIA GPU with 8GB+ VRAM
- **Minimum**: 6GB VRAM (with optimizations)
- **CPU Fallback**: Available but significantly slower

## Usage Examples

### Basic Usage (Python)

```python
from stable_diffusion import generate_image_difix

generate_image_difix(
    prompt="Astronaut in a jungle",
    style="photorealistic",
    save_path="output.png"
)
```

### API Usage (HTTP)

```bash
curl -X POST http://localhost:8000/generate \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Cyberpunk cityscape at sunset",
    "style": "futuristic",
    "model": "difix"
  }'
```

### Frontend Integration

The frontend can now specify the model:

```typescript
const response = await fetch("http://localhost:8000/generate", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    prompt: userPrompt,
    style: selectedStyle,
    model: "difix", // or "sdxl", "sdxl_api"
  }),
});
```

## Performance Comparison

| Model      | Quality    | Speed      | VRAM Usage | Best For                   |
| ---------- | ---------- | ---------- | ---------- | -------------------------- |
| DiFix      | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐   | 8GB+       | High-quality 3D conversion |
| SDXL Local | ⭐⭐⭐⭐   | ⭐⭐⭐     | 6GB+       | Balanced quality/speed     |
| SDXL API   | ⭐⭐⭐⭐   | ⭐⭐⭐⭐⭐ | 0GB        | No local GPU required      |

## Benefits for 2D-to-3D Pipeline

1. **Better Depth Separation**: DiFix generates images with clearer foreground/background distinction
2. **Enhanced Detail**: More detailed textures improve mesh quality
3. **Consistent Lighting**: Better depth map estimation from well-lit images
4. **Panoramic Optimization**: Custom prompts work better with DiFix's understanding

## Troubleshooting

### Common Issues

1. **Out of Memory Error**

   ```python
   # Solution: Use CPU fallback
   pipe = DiffusionPipeline.from_pretrained("nvidia/difix", torch_dtype=torch.float32)
   ```

2. **Model Not Found**

   - Ensure internet connection for initial download
   - Model will be cached locally after first use

3. **Slow Generation**
   - Reduce `num_inference_steps` to 20-25
   - Use `torch.float16` if supported

### Debug Mode

Enable debug logging:

```python
import logging
logging.basicConfig(level=logging.DEBUG)
```

## Future Enhancements

1. **Model Caching**: Preload models to reduce startup time
2. **Batch Processing**: Generate multiple variations simultaneously
3. **Custom Fine-tuning**: Train DiFix on architectural/landscape datasets
4. **Real-time Preview**: Stream intermediate generation steps

## Contributing

To add support for new models:

1. Add model function in `stable_diffusion.py`
2. Update `generate_image_with_model_selection()`
3. Add model to valid_models list in `main.py`
4. Update documentation and tests

---

**Note**: DiFix is a powerful model that significantly enhances the quality of generated images for 3D conversion. The fallback mechanisms ensure the pipeline remains robust while taking advantage of the latest AI capabilities.
