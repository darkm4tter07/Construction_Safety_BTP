import torch

# Store original torch.load
_original_torch_load = torch.load

def patched_torch_load(f, *args, **kwargs):
    """Patched torch.load that sets weights_only=False by default"""
    if 'weights_only' not in kwargs:
        kwargs['weights_only'] = False
    return _original_torch_load(f, *args, **kwargs)

# Apply patch
torch.load = patched_torch_load