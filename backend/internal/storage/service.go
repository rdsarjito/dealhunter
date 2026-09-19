package storage

import (
	"bytes"
	"context"
	"encoding/base64"
	"fmt"
	"io"
	"log"
	"strings"
	"time"

	"github.com/minio/minio-go/v7"
	"github.com/minio/minio-go/v7/pkg/credentials"
)

// Service wraps MinIO client untuk upload/delete/URL generation
type Service struct {
	client    *minio.Client
	bucket    string
	publicURL string // base public URL, e.g. "https://minio.ramadhaninursarjito.tech/dealhunter"
}

// New creates and initialises a MinIO storage service.
// It ensures the target bucket exists (creates it if not).
func New(endpoint, accessKey, secretKey, bucket, publicURL string, useSSL bool) (*Service, error) {
	client, err := minio.New(endpoint, &minio.Options{
		Creds:  credentials.NewStaticV4(accessKey, secretKey, ""),
		Secure: useSSL,
	})
	if err != nil {
		return nil, fmt.Errorf("minio: failed to create client: %w", err)
	}

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	// Buat bucket jika belum ada
	exists, err := client.BucketExists(ctx, bucket)
	if err != nil {
		return nil, fmt.Errorf("minio: failed to check bucket: %w", err)
	}
	if !exists {
		if err := client.MakeBucket(ctx, bucket, minio.MakeBucketOptions{}); err != nil {
			return nil, fmt.Errorf("minio: failed to create bucket %q: %w", bucket, err)
		}
		// Set bucket policy ke public-read supaya file bisa diakses tanpa auth
		policy := fmt.Sprintf(`{
			"Version":"2012-10-17",
			"Statement":[{
				"Effect":"Allow",
				"Principal":{"AWS":["*"]},
				"Action":["s3:GetObject"],
				"Resource":["arn:aws:s3:::%s/*"]
			}]
		}`, bucket)
		if err := client.SetBucketPolicy(ctx, bucket, policy); err != nil {
			log.Printf("[Storage] Warning: failed to set bucket policy: %v", err)
		}
		log.Printf("[Storage] Bucket %q created and set to public-read", bucket)
	}

	log.Printf("[Storage] MinIO connected: endpoint=%s bucket=%s ssl=%v", endpoint, bucket, useSSL)
	return &Service{client: client, bucket: bucket, publicURL: publicURL}, nil
}

// UploadBase64 mengambil string data:image/xxx;base64,<data>, upload ke MinIO,
// dan return public URL file tersebut.
// objectName adalah nama file di bucket (e.g. "thumbnails/alert-abc123.png")
func (s *Service) UploadBase64(ctx context.Context, objectName, base64Data string) (string, error) {
	// Parse "data:image/png;base64,xxxxx"
	contentType := "image/png"
	raw := base64Data

	if idx := strings.Index(base64Data, ";base64,"); idx != -1 {
		// Ambil content type dari prefix
		prefix := base64Data[:idx]           // "data:image/png"
		if colonIdx := strings.Index(prefix, ":"); colonIdx != -1 {
			contentType = prefix[colonIdx+1:]
		}
		raw = base64Data[idx+8:] // ambil setelah ";base64,"
	}

	decoded, err := base64.StdEncoding.DecodeString(raw)
	if err != nil {
		// Coba dengan RawStdEncoding jika ada padding issue
		decoded, err = base64.RawStdEncoding.DecodeString(raw)
		if err != nil {
			return "", fmt.Errorf("storage: failed to decode base64: %w", err)
		}
	}

	reader := bytes.NewReader(decoded)
	size := int64(len(decoded))

	_, err = s.client.PutObject(ctx, s.bucket, objectName, reader, size, minio.PutObjectOptions{
		ContentType: contentType,
	})
	if err != nil {
		return "", fmt.Errorf("storage: failed to upload %q: %w", objectName, err)
	}

	return s.PublicURL(objectName), nil
}

// UploadReader upload dari io.Reader langsung (untuk future use)
func (s *Service) UploadReader(ctx context.Context, objectName string, r io.Reader, size int64, contentType string) (string, error) {
	_, err := s.client.PutObject(ctx, s.bucket, objectName, r, size, minio.PutObjectOptions{
		ContentType: contentType,
	})
	if err != nil {
		return "", fmt.Errorf("storage: failed to upload %q: %w", objectName, err)
	}
	return s.PublicURL(objectName), nil
}

// Delete menghapus object dari bucket
func (s *Service) Delete(ctx context.Context, objectName string) error {
	return s.client.RemoveObject(ctx, s.bucket, objectName, minio.RemoveObjectOptions{})
}

// PublicURL mengembalikan URL publik untuk object tertentu
func (s *Service) PublicURL(objectName string) string {
	return fmt.Sprintf("%s/%s", strings.TrimRight(s.publicURL, "/"), objectName)
}

// IsBase64 mendeteksi apakah string adalah data URL base64 (bukan URL biasa)
func IsBase64(s string) bool {
	return strings.HasPrefix(s, "data:")
}

// ObjectNameFromURL ekstrak object name dari public URL
// Misal: "https://minio.example.com/dealhunter/thumbnails/abc.png" → "thumbnails/abc.png"
func (s *Service) ObjectNameFromURL(publicURL string) string {
	base := strings.TrimRight(s.publicURL, "/") + "/"
	return strings.TrimPrefix(publicURL, base)
}
