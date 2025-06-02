import { useState, useLayoutEffect, useRef } from "react";

export const useParentSize = () => {
  const parentRef = useRef(null);
  const [width, setWidth] = useState(0);

  useLayoutEffect(() => {
    const handlSetWidth = () => {
      if (parentRef.current) {
        setWidth(parentRef.current.offsetWidth);
      }
    };

    function handleResize() {
      handlSetWidth();
    }

    window.addEventListener("resize", handleResize);

    handlSetWidth();
  }, []);

  return [parentRef, width];
};
