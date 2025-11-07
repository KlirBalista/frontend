"use client";

import { useState, useRef } from "react";

const DocumentUpload = ({
  label,
  name,
  value,
  onChange,
  error,
  required = false,
  accept = "application/pdf,image/jpeg,image/png",
  maxSize = 5 * 1024 * 1024, // 5MB default max size
}) => {
  const [fileName, setFileName] = useState(value ? value.name : "");
  const [fileUrl, setFileUrl] = useState("");
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [fileError, setFileError] = useState("");
  const fileInputRef = useRef(null);

  const resetFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    setFileName("");
    setFileUrl("");
    setUploadProgress(0);
    setIsUploading(false);
    setFileError("");
    onChange(null);
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) {
      resetFileInput();
      return;
    }

    // Validate file size
    if (file.size > maxSize) {
      setFileError(
        `File size exceeds the ${(maxSize / (1024 * 1024)).toFixed(1)}MB limit`
      );
      resetFileInput();
      return;
    }

    // Validate file type
    const acceptedTypes = accept.split(",");
    const fileType = file.type;
    if (!acceptedTypes.includes(fileType)) {
      setFileError(
        `File type ${fileType} is not supported. Please upload a ${accept.replace(
          /,/g,
          " or "
        )} file.`
      );
      resetFileInput();
      return;
    }

    // Simulate upload progress
    setIsUploading(true);
    setFileName(file.name);
    setFileError("");

    // Create a preview URL for the file
    const url = URL.createObjectURL(file);
    setFileUrl(url);

    // Simulate upload progress for UI feedback
    let progress = 0;
    const interval = setInterval(() => {
      progress += 10;
      setUploadProgress(progress);
      if (progress >= 100) {
        clearInterval(interval);
        setIsUploading(false);
        onChange(file);
      }
    }, 100);

    // Clean up preview URL when component unmounts
    return () => {
      URL.revokeObjectURL(url);
      clearInterval(interval);
    };
  };

  const fileTypeIcon = (fileName) => {
    if (!fileName) return "📄";

    const extension = fileName.split(".").pop()?.toLowerCase();

    if (["jpg", "jpeg", "png", "gif"].includes(extension)) {
      return "🖼️";
    } else if (["pdf"].includes(extension)) {
      return "📑";
    } else if (["doc", "docx"].includes(extension)) {
      return "📝";
    }

    return "📄";
  };

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <label className="block text-sm font-medium text-gray-700">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
        {!required && <span className="text-xs text-gray-500">(Optional)</span>}
      </div>

      <div className="mt-1 flex flex-col space-y-2">
        <div
          className={`border-2 border-dashed rounded-md p-4 flex flex-col items-center justify-center cursor-pointer transition-colors ${
            fileError
              ? "border-red-300 bg-red-50"
              : "border-gray-300 hover:border-indigo-300 hover:bg-indigo-50"
          }`}
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            name={name}
            onChange={handleFileChange}
            accept={accept}
            className="hidden"
            disabled={isUploading}
          />

          {!fileName ? (
            <div className="text-center">
              <div className="text-gray-500 text-4xl mb-2">📤</div>
              <p className="text-sm text-gray-600">
                Click to select or drag and drop a file here
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Supports: {accept.split(",").join(", ")}
              </p>
              <p className="text-xs text-gray-500">
                Max size: {(maxSize / (1024 * 1024)).toFixed(1)}MB
              </p>
            </div>
          ) : (
            <div className="w-full">
              <div className="flex items-center mb-2">
                <span className="text-2xl mr-2">{fileTypeIcon(fileName)}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {fileName}
                  </p>
                </div>
              </div>

              {isUploading ? (
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div
                    className="bg-indigo-600 h-2.5 rounded-full"
                    style={{ width: `${uploadProgress}%` }}
                  ></div>
                </div>
              ) : (
                <div className="flex justify-between">
                  <span className="text-xs text-green-600">✓ Uploaded</span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      resetFileInput();
                    }}
                    className="text-xs text-red-600 hover:text-red-800"
                  >
                    Remove
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {fileError && <p className="text-sm text-red-600">{fileError}</p>}

        {error && <p className="text-sm text-red-600">{error}</p>}

        {fileUrl &&
          !isUploading &&
          ["image/jpeg", "image/png", "image/gif"].includes(value?.type) && (
            <div className="mt-2">
              <p className="text-sm font-medium text-gray-700 mb-1">Preview:</p>
              <img
                src={fileUrl}
                alt="Preview"
                className="max-h-40 max-w-full object-contain border rounded"
              />
            </div>
          )}
      </div>
    </div>
  );
};

export default DocumentUpload;
