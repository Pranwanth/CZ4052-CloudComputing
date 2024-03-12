import { useRef } from "react";

const ImageUpload = ({ onImageUpload }) => {
  const fileInputRef = useRef(null);

  const handleFileInputChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      onImageUpload(file);
    }
  };

  const handleCameraUploadClick = () => {
    // Open device camera for taking a picture
    fileInputRef.current.setAttribute("capture", "camera");
    fileInputRef.current.click();
  };

  const handleGalleryUploadClick = () => {
    // Open device gallery for selecting an image
    fileInputRef.current.setAttribute("capture", "filesystem");
    fileInputRef.current.click();
  };

  return (
    <div>
      <input
        type='file'
        accept='image/*'
        ref={fileInputRef}
        style={{ display: "none" }}
        onChange={handleFileInputChange}
      />
      <button
        onClick={handleCameraUploadClick}
        className='text-lg font-semibold appearance-none bg-white pr-10 pl-2 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring focus:border-green-500 w-full'
      >
        Take a Picture
      </button>
      <button
        onClick={handleGalleryUploadClick}
        className='text-lg font-semibold appearance-none bg-white pr-10 pl-2 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring focus:border-green-500 w-full'
      >
        Upload from Gallery
      </button>
    </div>
  );
};

export default ImageUpload;
