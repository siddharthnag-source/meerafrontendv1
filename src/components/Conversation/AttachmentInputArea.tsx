'use client';

import { useToast } from '@/components/ui/ToastProvider';
import { isIOS } from '@/lib/deviceInfo';
import { ChatAttachmentInputState } from '@/types/chat';
import React, { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { CgAttachment } from 'react-icons/cg';
import { AttachmentMenuComponent } from './AttachmentMenu';

const MAX_ATTACHMENTS_DEFAULT = 10;

interface AttachmentInputAreaProps {
  maxAttachments?: number;
  onAttachmentsChange: (attachments: ChatAttachmentInputState[]) => void;
  onClearRequest?: () => void; // Optional: To be called when parent wants to clear attachments
  messageValue: string; // Needed for resetInputHeightState logic
  resetInputHeightState: () => void;
  children: React.ReactNode; // Added to accept textarea and send button
  existingAttachments?: ChatAttachmentInputState[]; // Added to allow parent to control attachments
}

// Define the type for the imperative methods exposed by the ref
export interface AttachmentInputAreaRef {
  clear: () => void;
  removeAttachment: (index: number) => void;
  processPastedFiles: (files: File[]) => void;
}

export const AttachmentInputArea = forwardRef<AttachmentInputAreaRef, AttachmentInputAreaProps>(
  (
    {
      maxAttachments = MAX_ATTACHMENTS_DEFAULT,
      onAttachmentsChange,
      onClearRequest,
      messageValue,
      resetInputHeightState,
      children, // Destructure children
      existingAttachments, // Destructure existingAttachments
    },
    ref, // Added ref here
  ) => {
    const [attachments, setAttachments] = useState<ChatAttachmentInputState[]>(existingAttachments || []);
    const [showAttachMenu, setShowAttachMenu] = useState(false);
    const [isIosDevice, setIsIosDevice] = useState(false);

    const { showToast } = useToast();
    const menuRef = useRef<HTMLDivElement>(null);
    const attachButtonRef = useRef<HTMLButtonElement>(null);
    const attachmentsForCleanupRef = useRef<ChatAttachmentInputState[]>(attachments);

    useEffect(() => {
      setIsIosDevice(isIOS());
    }, []);

    // Sync attachments with parent when they change externally
    useEffect(() => {
      if (existingAttachments) {
        setAttachments(existingAttachments);
      }
    }, [existingAttachments]);

    useEffect(() => {
      attachmentsForCleanupRef.current = attachments;
    }, [attachments]);

    useEffect(() => {
      if (onClearRequest) {
      }
    }, [onClearRequest]);

    // Effect for cleaning up object URLs on unmount
    useEffect(() => {
      return () => {
        attachmentsForCleanupRef.current.forEach((att) => {
          if (att.previewUrl) {
            URL.revokeObjectURL(att.previewUrl);
          }
        });
      };
    }, []);

    const internalClearAttachments = () => {
      setAttachments([]);
      onAttachmentsChange([]);
      if (messageValue === '') {
        resetInputHeightState();
      }
    };

    // Expose clear attachments to parent if needed, or handle via prop change
    useEffect(() => {
      if (onClearRequest) {
      }
    }, [onClearRequest]);

    const isValidFileType = (file: File): boolean => {
      return file.type.startsWith('image/') || file.type === 'application/pdf';
    };

    const processFiles = (files: FileList | null) => {
      if (!files?.length) return;

      const newAttachments: ChatAttachmentInputState[] = [];
      let invalidCount = 0;

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (attachments.length + newAttachments.length >= maxAttachments) {
          showToast(`You can select a maximum of ${maxAttachments} files.`, {
            type: 'error',
            position: 'conversation',
          });
          break;
        }

        if (!isValidFileType(file)) {
          invalidCount++;
          continue;
        }

        newAttachments.push({
          file,
          previewUrl: URL.createObjectURL(file),
          type: file.type === 'application/pdf' ? 'document' : 'image',
        });
      }

      if (newAttachments.length > 0) {
        const updatedAttachments = [...attachments, ...newAttachments];
        setAttachments(updatedAttachments);
        onAttachmentsChange(updatedAttachments);
      }

      if (invalidCount > 0) {
        showToast('Error uploading file. Only PDF and images are supported.', {
          type: 'error',
          position: 'conversation',
        });
      }
    };

    const handleFileSelection = (event: React.ChangeEvent<HTMLInputElement>) => {
      processFiles(event.target.files);
      setShowAttachMenu(false);
      if (event.target) {
        event.target.value = ''; // Reset the input value
      }
    };

    const handleDocumentAttachment = () => {
      const input = document.createElement('input');
      input.type = 'file';
      input.multiple = true;
      input.accept = 'application/pdf';
      input.onchange = (e) => handleFileSelection(e as unknown as React.ChangeEvent<HTMLInputElement>);
      input.click();
    };

    const handleImageAttachment = () => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.multiple = true;
      input.onchange = (e) => handleFileSelection(e as unknown as React.ChangeEvent<HTMLInputElement>);
      input.click();
    };

    const removeAttachment = (indexToRemove: number) => {
      const attachmentToRemove = attachments[indexToRemove];
      if (attachmentToRemove?.previewUrl) {
        URL.revokeObjectURL(attachmentToRemove.previewUrl);
      }

      const newAttachments = attachments.filter((_, index) => index !== indexToRemove);
      setAttachments(newAttachments);
      onAttachmentsChange(newAttachments);

      if (newAttachments.length === 0 && messageValue === '') {
        resetInputHeightState();
      }
    };

    const toggleAttachMenu = () => {
      if (isIosDevice) {
        // On iOS, directly open the file input
        const input = document.createElement('input');
        input.type = 'file';
        input.multiple = true;
        input.accept = 'application/pdf,image/*'; // Allow both PDF and images
        input.onchange = (e) => handleFileSelection(e as unknown as React.ChangeEvent<HTMLInputElement>);
        input.click();
      } else {
        setShowAttachMenu((prev) => !prev);
      }
    };

    useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (
          menuRef.current &&
          !menuRef.current.contains(event.target as Node) &&
          attachButtonRef.current &&
          !attachButtonRef.current.contains(event.target as Node)
        ) {
          setShowAttachMenu(false);
        }
      };
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }, []);

    useImperativeHandle(ref, () => ({
      clear: internalClearAttachments,
      removeAttachment,
      processPastedFiles: (files: File[]) => {
        const newAttachments: ChatAttachmentInputState[] = files
          .slice(0, maxAttachments - attachments.length)
          .filter(isValidFileType)
          .map((file) => ({
            file,
            previewUrl: URL.createObjectURL(file),
            type: file.type === 'application/pdf' ? 'document' : 'image',
          }));

        if (newAttachments.length > 0) {
          const updatedAttachments = [...attachments, ...newAttachments];
          setAttachments(updatedAttachments);
          onAttachmentsChange(updatedAttachments);
        }
      },
    }));

    return (
      <div className="relative w-full">
        <div className="flex items-end w-full ">
          <div className="flex items-center">
            <div className="relative">
              <button
                ref={attachButtonRef}
                type="button"
                onClick={toggleAttachMenu}
                className="p-2.5 text-primary/70 hover:text-primary focus:outline-none transition-colors cursor-pointer"
                title="Add files and photos"
              >
                <CgAttachment size={20} />
              </button>
              {!isIosDevice && showAttachMenu && (
                <AttachmentMenuComponent
                  menuRef={menuRef}
                  handleDocumentAttachment={handleDocumentAttachment}
                  handleImageAttachment={handleImageAttachment}
                />
              )}
            </div>
          </div>
          {children}
        </div>
      </div>
    );
  },
);

AttachmentInputArea.displayName = 'AttachmentInputArea';
