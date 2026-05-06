import { useEffect, useRef, useState } from 'react';

const getElementWidth = (element) => {
    if (!element) {
        return 0;
    }

    return element.getBoundingClientRect().width || element.clientWidth || 0;
};

export const useObservedWidth = () => {
    const elementRef = useRef(null);
    const [width, setWidth] = useState(0);

    useEffect(() => {
        const element = elementRef.current;

        if (!element) {
            return undefined;
        }

        const updateWidth = () => {
            setWidth(getElementWidth(element));
        };

        updateWidth();

        if (typeof ResizeObserver !== 'undefined') {
            const resizeObserver = new ResizeObserver(() => {
                updateWidth();
            });

            resizeObserver.observe(element);

            return () => {
                resizeObserver.disconnect();
            };
        }

        window.addEventListener('resize', updateWidth);

        return () => {
            window.removeEventListener('resize', updateWidth);
        };
    }, []);

    return { elementRef, width };
};
