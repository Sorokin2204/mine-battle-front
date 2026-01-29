import React, { useEffect, useRef } from 'react';
import styles from './Waiting.module.scss';
import clsx from 'clsx';
import Lottie from 'lottie-react';
import hourglass from '../../../../public/hourglass.json';
type Props = {};

export default function Waiting({}: Props) {
  const lottieRef = useRef<any>();
  useEffect(() => {
    console.log(lottieRef.current);
    if (lottieRef.current) {
      lottieRef.current.setSpeed(1.5);
    }
  }, [lottieRef]);
  return <Lottie lottieRef={lottieRef} animationData={hourglass} loop={true} style={{ width: '20px', height: '20px' }} />;
}
