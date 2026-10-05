import { memo, useEffect, useMemo, useRef } from 'react';
import Lottie, { type LottieRefCurrentProps } from 'lottie-react';
import hourglass from '../../../../public/hourglass.json';

const animationStyle = { width: '20px', height: '20px' } as const;

function Waiting() {
  const lottieRef = useRef<LottieRefCurrentProps | null>(null);

  // lottie-web mutates animation data while preparing it. Keep a separate,
  // stable copy for every mounted hourglass so several badges cannot affect
  // one another and a parent render cannot restart the animation.
  const animationData = useMemo(() => structuredClone(hourglass), []);

  useEffect(() => {
    lottieRef.current?.setSpeed(1.5);
  }, []);

  return <Lottie lottieRef={lottieRef} animationData={animationData} loop style={animationStyle} />;
}

export default memo(Waiting);
