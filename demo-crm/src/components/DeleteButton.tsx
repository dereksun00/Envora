"use client";

import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  useDisclosure,
} from "@heroui/react";
import { useRouter } from "next/navigation";
import { useState } from "react";

interface DeleteButtonProps {
  entityName: string;
  entityType: string;
  deleteUrl: string;
  redirectUrl: string;
}

export default function DeleteButton({ entityName, entityType, deleteUrl, redirectUrl }: DeleteButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const { isOpen, onOpen, onOpenChange } = useDisclosure();

  async function handleDelete() {
    setLoading(true);
    await fetch(deleteUrl, { method: "DELETE" });
    router.push(redirectUrl);
    router.refresh();
  }

  return (
    <>
      <Button color="danger" variant="flat" onPress={onOpen} startContent={
        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
          <path fillRule="evenodd" d="M9 2H7a1 1 0 00-1 1v1h4V3a1 1 0 00-1-1zM4 4V3a3 3 0 013-3h2a3 3 0 013 3v1h2a1 1 0 110 2h-.08L13 14a2 2 0 01-2 2H5a2 2 0 01-2-2L2.08 6H2a1 1 0 010-2h2zm2 3a1 1 0 012 0v5a1 1 0 11-2 0V7zm4 0a1 1 0 10-2 0v5a1 1 0 102 0V7z" clipRule="evenodd" />
        </svg>
      }>
        Delete
      </Button>
      <Modal isOpen={isOpen} onOpenChange={onOpenChange}>
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader>Delete {entityType}</ModalHeader>
              <ModalBody>
                <p>
                  Are you sure you want to delete <strong>&quot;{entityName}&quot;</strong>? This action cannot be undone and will remove all associated data.
                </p>
              </ModalBody>
              <ModalFooter>
                <Button variant="flat" onPress={onClose}>
                  Cancel
                </Button>
                <Button color="danger" onPress={handleDelete} isLoading={loading}>
                  Delete
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </>
  );
}
