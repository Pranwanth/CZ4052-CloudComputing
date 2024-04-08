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
    fileInputRef.current.setAttribute("capture", "camera");
    fileInputRef.current.click();
  };

  const handleGalleryUploadClick = () => {
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
        className='text-lg font-semibold appearance-none pr-10 pl-2 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring focus:border-green-500 text-center w-full'
        style={{ backgroundColor: "#dfe7e0" }}
      >
        Take a Picture&nbsp; 📷
      </button>
      <br></br>
      <br></br>
      <button
        onClick={handleGalleryUploadClick}
        className='text-lg font-semibold appearance-none bg-white pr-10 pl-2 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring focus:border-green-500 text-center w-full'
        style={{ backgroundColor: "rgb(165 192 168)" }}
      >
        Upload from Gallery&nbsp; ⬆️
      </button>
    </div>
  );
};

export default ImageUpload;
