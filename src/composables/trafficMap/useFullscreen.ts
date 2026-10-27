import { onBeforeUnmount, onMounted, ref, type Ref } from "vue";

export function useFullscreen(target: Ref<HTMLElement | null>) {
    
    const isFullscreen = ref(false);

    const onChange = () => {
        isFullscreen.value = document.fullscreenElement === target.value;
    }

    const toggleFullscreen = async () => {
        try {
            if (document.fullscreenElement) await document.exitFullscreen();
            else await target.value?.requestFullscreen();
        } catch (err) {
            console.error("Fullscreen failed", err);
        }
    }

    onMounted(() => document.addEventListener("fullscreenchange", onChange));
    onBeforeUnmount(() => document.removeEventListener("fullscreenchange", onChange));

    return { isFullscreen, toggleFullscreen };

}