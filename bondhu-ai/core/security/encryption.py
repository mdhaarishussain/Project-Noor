"""
Encryption utilities for end-to-end encryption in Bondhu AI

This module provides cryptographic functions for securing sensitive chat data.
"""

import logging
import os
import base64
from typing import Tuple, Optional
from cryptography.hazmat.primitives.ciphers import Cipher, algorithms, modes
from cryptography.hazmat.primitives import hashes, serialization
from cryptography.hazmat.primitives.asymmetric import rsa, padding
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
from cryptography.hazmat.backends import default_backend

logger = logging.getLogger("bondhu.encryption")


class EncryptionService:
    """
    Service for handling encryption and decryption operations.
    """
    
    def __init__(self):
        self.backend = default_backend()
        logger.info("EncryptionService initialized")
    
    def generate_rsa_keypair(self) -> Tuple[bytes, bytes]:
        """
        Generate a new RSA key pair for a user.
        
        Returns:
            Tuple of (private_key_bytes, public_key_bytes)
        """
        try:
            # Generate private key
            private_key = rsa.generate_private_key(
                public_exponent=65537,
                key_size=2048,
                backend=self.backend
            )
            
            # Get public key
            public_key = private_key.public_key()
            
            # Serialize keys
            private_pem = private_key.private_bytes(
                encoding=serialization.Encoding.PEM,
                format=serialization.PrivateFormat.PKCS8,
                encryption_algorithm=serialization.NoEncryption()
            )
            
            public_pem = public_key.public_bytes(
                encoding=serialization.Encoding.PEM,
                format=serialization.PublicFormat.SubjectPublicKeyInfo
            )
            
            logger.info("RSA key pair generated successfully")
            return private_pem, public_pem
            
        except Exception as e:
            logger.error(f"Error generating RSA key pair: {e}")
            raise
    
    def generate_session_key(self) -> bytes:
        """
        Generate a random session key for symmetric encryption.
        
        Returns:
            32-byte random key for AES-256
        """
        try:
            key = os.urandom(32)  # 256 bits
            logger.debug("Session key generated successfully")
            return key
        except Exception as e:
            logger.error(f"Error generating session key: {e}")
            raise
    
    def encrypt_with_rsa(self, data: bytes, public_key_pem: bytes) -> bytes:
        """
        Encrypt data using RSA public key.
        
        Args:
            data: Data to encrypt
            public_key_pem: Public key in PEM format
            
        Returns:
            Encrypted data
        """
        try:
            # Load public key
            public_key = serialization.load_pem_public_key(
                public_key_pem,
                backend=self.backend
            )
            
            # Encrypt data
            encrypted_data = public_key.encrypt(
                data,
                padding.OAEP(
                    mgf=padding.MGF1(algorithm=hashes.SHA256()),
                    algorithm=hashes.SHA256(),
                    label=None
                )
            )
            
            logger.debug(f"Data encrypted with RSA, size: {len(encrypted_data)} bytes")
            return encrypted_data
            
        except Exception as e:
            logger.error(f"Error encrypting with RSA: {e}")
            raise
    
    def decrypt_with_rsa(self, encrypted_data: bytes, private_key_pem: bytes) -> bytes:
        """
        Decrypt data using RSA private key.
        
        Args:
            encrypted_data: Data to decrypt
            private_key_pem: Private key in PEM format
            
        Returns:
            Decrypted data
        """
        try:
            # Load private key
            private_key = serialization.load_pem_private_key(
                private_key_pem,
                password=None,
                backend=self.backend
            )
            
            # Decrypt data
            decrypted_data = private_key.decrypt(
                encrypted_data,
                padding.OAEP(
                    mgf=padding.MGF1(algorithm=hashes.SHA256()),
                    algorithm=hashes.SHA256(),
                    label=None
                )
            )
            
            logger.debug("Data decrypted with RSA successfully")
            return decrypted_data
            
        except Exception as e:
            logger.error(f"Error decrypting with RSA: {e}")
            raise
    
    def encrypt_message(self, message: str, session_key: bytes) -> Tuple[bytes, bytes]:
        """
        Encrypt a message using AES-256-GCM.
        
        Args:
            message: Message to encrypt
            session_key: 32-byte session key
            
        Returns:
            Tuple of (encrypted_message, nonce)
        """
        try:
            # Generate a random 12-byte nonce
            nonce = os.urandom(12)
            
            # Create cipher
            cipher = Cipher(
                algorithms.AES(session_key),
                modes.GCM(nonce),
                backend=self.backend
            )
            
            # Encrypt message
            encryptor = cipher.encryptor()
            encrypted_message = encryptor.update(message.encode()) + encryptor.finalize()
            
            logger.debug(f"Message encrypted, size: {len(encrypted_message)} bytes")
            return encrypted_message, nonce
            
        except Exception as e:
            logger.error(f"Error encrypting message: {e}")
            raise
    
    def decrypt_message(self, encrypted_message: bytes, nonce: bytes, session_key: bytes) -> str:
        """
        Decrypt a message using AES-256-GCM.
        
        Args:
            encrypted_message: Message to decrypt
            nonce: 12-byte nonce used for encryption
            session_key: 32-byte session key
            
        Returns:
            Decrypted message
        """
        try:
            # Create cipher
            cipher = Cipher(
                algorithms.AES(session_key),
                modes.GCM(nonce),
                backend=self.backend
            )
            
            # Decrypt message
            decryptor = cipher.decryptor()
            decrypted_message = decryptor.update(encrypted_message) + decryptor.finalize()
            
            logger.debug("Message decrypted successfully")
            return decrypted_message.decode()
            
        except Exception as e:
            logger.error(f"Error decrypting message: {e}")
            raise
    
    def derive_key_from_password(self, password: str, salt: bytes) -> bytes:
        """
        Derive a key from a password using PBKDF2.
        
        Args:
            password: User password
            salt: Random salt
            
        Returns:
            32-byte derived key
        """
        try:
            kdf = PBKDF2HMAC(
                algorithm=hashes.SHA256(),
                length=32,
                salt=salt,
                iterations=100000,
                backend=self.backend
            )
            key = kdf.derive(password.encode())
            
            logger.debug("Key derived from password successfully")
            return key
            
        except Exception as e:
            logger.error(f"Error deriving key from password: {e}")
            raise


# Global instance
_encryption_service: Optional[EncryptionService] = None


def get_encryption_service() -> EncryptionService:
    """
    Get singleton instance of EncryptionService.
    
    Returns:
        EncryptionService instance
    """
    global _encryption_service
    if _encryption_service is None:
        _encryption_service = EncryptionService()
    return _encryption_service
