import { ref, onMounted, onUnmounted, nextTick } from 'vue';

/**
 * Scales `elRef` to fit within the viewport with no scrollbar.
 * Scale never exceeds 1 (no upscaling on large screens).
 */
export function useViewportScale(elRef) {
    const scale = ref(1);

    const recompute = async () => {
        if (!elRef.value) return;
        // Reset to natural size first so we measure un-scaled dimensions
        scale.value = 1;
        await nextTick();
        const el = elRef.value;
        const sw = window.innerWidth / el.offsetWidth;
        const sh = window.innerHeight / el.offsetHeight;
        scale.value = Math.min(sw, sh, 1);
    };

    onMounted(() => {
        recompute();
        window.addEventListener('resize', recompute);
    });
    onUnmounted(() => {
        window.removeEventListener('resize', recompute);
    });

    return { scale, recompute };
}
