import { createPortal } from "react-dom";
import "./customModal.css";
import { useEffect } from "react";



const CustomModal = ({ isOpen, onClose, title, children }) => {
  useEffect(() => {
  if (isOpen) {
    document.body.style.overflow = "hidden";
  } else {
    document.body.style.overflow = "auto";
  }

  return () => {
    document.body.style.overflow = "auto";
  };
}, [isOpen]);
  if (!isOpen) return null;

  return createPortal(
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-container"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
              <h2>
                <i className="fas fa-share-alt" style={{ color: '#2a6f97' }}></i>
                Partager {title}
              </h2>
              <button className='modal-close' onClick={onClose}>
                <i className="fas fa-times"></i>
              </button>
            </div>

        <div className="modal-content">
          {children}
        </div>
        <div className='modal-footer'>
          <button className="modal-btn-secondary" onClick={onClose}>
            Fermer
          </button>
        </div>
      </div>
    </div>,
    document.getElementById("modal-root")
  );
};

export default CustomModal;
