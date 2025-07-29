import {useEffect} from "react";

export function useLayoutScale(layoutRef) {
    useEffect(() => {
        const baseHeight = 1080;

        const scaleLayout = () => {
            const height = window.innerHeight;
            const scale = Math.min(height / baseHeight, 1);
            if (layoutRef.current) {
                layoutRef.current.style.transform = `scale(${scale})`;
            }
        };

        scaleLayout();
        window.addEventListener('resize', scaleLayout);
        return () => window.removeEventListener('resize', scaleLayout);
    }, [layoutRef]);
}
