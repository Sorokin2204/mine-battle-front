import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import clsx from 'clsx';
import styles from './Modal.module.scss';
import Icon from '../Icon/Icon';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title?: string;
  className?: string;
  closeOnOverlay?: boolean;
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, children, title, className, closeOnOverlay = true }) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className={styles.modalRoot}>
          {' '}
          <motion.div className={styles.overlay} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={closeOnOverlay ? onClose : undefined} />{' '}
          <button className={styles.closeBtn} onClick={onClose}>
            <Icon icon="close" />
          </button>
          <motion.div className={clsx(styles.modal, className)} initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }} transition={{ type: 'spring', damping: 25, stiffness: 300 }}>
            {' '}
            {title && (
              <div className={styles.header}>
                <h2 className={styles.title}>{title}</h2>
              </div>
            )}
            <div className={styles.content}>{children}</div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default Modal;
