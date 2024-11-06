// Import necessary modules and components
import React, { useState, useEffect, useRef } from "react";
import theme from "theme";
import {
  Theme,
  Text,
  Input,
  Hr,
  Box,
  Button,
  Section,
  Icon,
  Select,
} from "@quarkly/widgets";
import { Helmet } from "react-helmet";
import { GlobalQuarklyPageStyles } from "global-page-styles";
import { MdDeleteSweep, MdNoteAdd, MdArrowBack } from "react-icons/md";
import {
  fetchCustomerById,
  editCustomerById,
  uploadImage,
  uploadAudio,
  deleteImageFromStorage, // Import delete functions (to be implemented)
  deleteAudioFromStorage, // Import delete functions (to be implemented)
} from "../utils/firebaseConfig"; // Import Firebase functions
import { useHistory, useLocation } from "react-router-dom";
import { FaWhatsapp } from "react-icons/fa";

// Helper function to extract the UUID from the URL query string
const useQuery = () => {
  return new URLSearchParams(useLocation().search);
};

// Custom File Uploader Component
const FileUploader = ({ handleFile }) => {
  const hiddenFileInput = useRef(null);

  const handleClick = () => {
    hiddenFileInput.current.click();
  };

  const handleChange = (event) => {
    const files = Array.from(event.target.files);
    handleFile(files);
  };

  return (
    <>
      <Button
        className="button-upload"
        onClick={handleClick}
        margin="20px 0"
        background="#cb7731"
        color="white"
        padding="10px 20px"
        border-radius="7.5px"
        aria-label="Upload Measurement Images"
      >
        Upload Measurement Images
      </Button>
      <input
        type="file"
        onChange={handleChange}
        ref={hiddenFileInput}
        style={{ display: "none" }}
        multiple
        accept="image/*"
      />
    </>
  );
};

// Audio Recorder Component with Deletion Capability

export default () => {
  const history = useHistory();
  const query = useQuery();
  const uuid = query.get("uuid"); // Extract UUID from URL
  const [customerData, setCustomerData] = useState(null); // To store fetched customer data
 
  const [loading, setLoading] = useState(true); // Loading state
  const [error, setError] = useState(null); // Error state
  const [imageUrls, setImageUrls] = useState([]); // For storing image URLs
 
  const [modalOpen, setModalOpen] = useState(false); // For modal state
  const [modalImageUrl, setModalImageUrl] = useState(""); // For the image in modal
  const [deadline, setDeadline] = useState(""); // For storing the deadline date if applicable

  // Fetch customer details on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        if (uuid) {
          fetchCustomerById(uuid, (data) => {
            if (data) {
              setCustomerData(data);
              setImageUrls(data.images || []);
              // If you have pieces or progress in customer data, set them here
              // setPieces(data.pieces?.details || []);
              // setProgress(data.progress || "Pending");
            } else {
              setError("Customer not found or invalid UUID.");
            }
            setLoading(false);
          });
        } else {
          setError("Invalid customer UUID.");
          setLoading(false);
        }
      } catch (err) {
        setError("Error fetching customer data.");
        setLoading(false);
      }
    };
    fetchData();
  }, [uuid]);

  // Handle file upload for additional images
  const handleFileUpload = async (files) => {
    try {
      const uploadedImageUrls = await Promise.all(
        files.map((file) => uploadImage(file)) // Use uploadImage function
      );
      setImageUrls((prevUrls) => [...prevUrls, ...uploadedImageUrls]);
    } catch (error) {
      console.error("Error uploading images:", error);
      alert("Failed to upload images. Please try again.");
    }
  };

  // Handle audio upload
  

  // Handle deleting an image
  const handleDeleteImage = async (index) => {
    if (
      window.confirm(
        "Are you sure you want to delete this image? This action cannot be undone."
      )
    ) {
      try {
        const imageToDelete = imageUrls[index];
        // Extract storage path from image URL
        const storagePath = extractStoragePathFromURL(imageToDelete); // Implement this function based on your URL structure
        if (storagePath) {
          await deleteImageFromStorage(storagePath); // Implement deleteImageFromStorage in firebaseConfig.js
        }
        const updatedImages = imageUrls.filter((_, i) => i !== index);
        setImageUrls(updatedImages);
      } catch (error) {
        console.error("Error deleting image:", error);
        alert("Failed to delete image. Please try again.");
      }
    }
  };

  // Helper function to extract storage path from URL (Implementation depends on your storage setup)
  const extractStoragePathFromURL = (url) => {
    // Example implementation:
    // Assuming your Firebase storage URLs are structured as:
    // https://firebasestorage.googleapis.com/v0/b/your-app.appspot.com/o/path%2Fto%2Fimage.jpg?...
    // You need to extract 'path/to/image.jpg'
    try {
      const baseURL = "https://firebasestorage.googleapis.com/v0/b/your-app.appspot.com/o/";
      if (url.startsWith(baseURL)) {
        const encodedPath = url.substring(baseURL.length, url.indexOf("?"));
        return decodeURIComponent(encodedPath);
      }
      return null;
    } catch (error) {
      console.error("Error extracting storage path:", error);
      return null;
    }
  };

  // Handle deleting audio
 

  // Function to format phone number for WhatsApp API
  const formatPhoneNumber = (phone) => {
    // Remove any non-digit characters
    return phone.replace(/\D/g, "");
  };

  // Handle WhatsApp click


  // Handle updating customer data in Firebase
  const handleSaveCustomer = async () => {
    try {
     
      const updatedCustomerData = {
        ...customerData,
        // If you have pieces or progress in customer data, include them here
        // pieces: {
        //   ...customerData.pieces,
        //   details: pieces,
        //   number_of_pieces: totalPieces,
        // },
        
        images: imageUrls, // Include updated images array
        
      };
      await editCustomerById(uuid, updatedCustomerData);
      alert("Customer updated successfully");
      history.push("/customers");
    } catch (err) {
      console.error("Error updating customer:", err);
      alert("Error updating customer. Please try again.");
    }
  };

  // Open image in modal
  const openImageInModal = (url) => {
    setModalImageUrl(url);
    setModalOpen(true);
  };

  // Close modal
  const closeModal = () => {
    setModalOpen(false);
    setModalImageUrl("");
  };


  if (loading) {
    return (
      <Theme theme={theme}>
        <GlobalQuarklyPageStyles pageUrl={"edit-customer"} />
        <Helmet>
          <title>Edit Customer</title>
          <link
            rel={"shortcut icon"}
            href={"https://i.imgur.com/crcVWqA.png"}
            type={"image/x-icon"}
          />
        </Helmet>
        <Section padding="90px 0 100px 0" quarkly-title="Edit-Customer">
          <Text>Loading...</Text>
        </Section>
      </Theme>
    );
  }

  if (error) {
    return (
      <Theme theme={theme}>
        <GlobalQuarklyPageStyles pageUrl={"edit-customer"} />
        <Helmet>
          <title>Edit Customer</title>
          <link
            rel={"shortcut icon"}
            href={"https://i.imgur.com/crcVWqA.png"}
            type={"image/x-icon"}
          />
        </Helmet>
        <Section padding="90px 0 100px 0" quarkly-title="Edit-Customer">
          <Text>{error}</Text>
        </Section>
      </Theme>
    );
  }

  return (
    <Theme theme={theme}>
      <GlobalQuarklyPageStyles pageUrl={"edit-customer"} />
      <Helmet>
        <title>Edit Customer</title>
        <link
          rel={"shortcut icon"}
          href={"https://i.imgur.com/crcVWqA.png"}
          type={"image/x-icon"}
        />
      </Helmet>

      {/* Main Content */}
      <Section padding="90px 0 100px 0" quarkly-title="Edit-Customer">
        {/* Begin Fixed-Width Container */}
        <Box
          min-width="1200px"
          overflow="auto"
          margin="0 auto"
          padding="0 10px" // Optional: Add horizontal padding
        >
          {/* Header Section */}
          <Box
            display="flex"
            align-items="center"
            justify-content="center"
            position="relative"
          >
            <Icon
              category="md"
              icon={MdArrowBack}
              size="40px"
              margin="16px"
              padding="0px 0px 16px 0px"
              onClick={() => history.push("/customers")}
              style={{ cursor: "pointer", position: "absolute", left: "0" }}
              aria-label="Back to Customers"
            />
            <Text
              margin="0px 0px 20px 0px"
              text-align="center"
              font="normal 500 56px/1.2 --fontFamily-serifGeorgia"
              color="--dark"
              sm-margin="0px 0px 30px 0px"
            >
              Edit Customer
            </Text>
          </Box>

          <Box min-width="100px" min-height="100px" padding="15px 0px 15px 0px">
            {/* Customer Name */}
            
            <Input
              display="block"
              background="white"
              border-color="--color-darkL2"
              border-radius="7.5px"
              width="50%"
              value={customerData.customer_name || ""}
              readOnly
              aria-label="Customer Name"
            />
            <Hr margin="15px 0px 15px 0px" width="1200px" />

            {/* Phone Number */}
            <Text margin="15px 0px 15px 0px">Phone Number</Text>
            <Input
              display="block"
              background="white"
              border-color="--color-darkL2"
              border-radius="7.5px"
              width="50%"
              value={customerData.phone_number || ""}
              readOnly
              aria-label="Phone Number"
            />
            <Hr margin="15px 0px 15px 0px" width="1200px" />

            {/* Images Section */}
            <Text margin="15px 0px 15px 0px">Images</Text>
            <FileUploader handleFile={handleFileUpload} />
            {imageUrls.length > 0 && (
              <Box
                display="grid"
                grid-template-columns={`repeat(${Math.min(
                  imageUrls.length,
                  4
                )}, 225px)`}
                grid-auto-rows="225px"
                grid-gap="15px"
                width={`${
                  Math.min(imageUrls.length, 4) * 225 +
                  (Math.min(imageUrls.length, 4) - 1) * 15
                }px`}
                overflow="auto"
                padding="15px"
                border="1px solid #ccc"
                margin="15px 0"
              >
                {imageUrls.map((url, index) => (
                  <Box
                    key={index}
                    as="div"
                    position="relative" // To position the delete icon
                  >
                    {/* Image Thumbnail */}
                    <Box
                      as="img"
                      src={url}
                      width="225px"
                      height="225px"
                      object-fit="cover"
                      border-radius="5px"
                      onClick={() => openImageInModal(url)}
                      style={{ cursor: "pointer" }}
                      alt={`Customer Image ${index + 1}`}
                    />
                    {/* Delete Icon */}
                    <Icon
                      category="md"
                      icon={MdDeleteSweep}
                      size="24px"
                      color="#ff0000"
                      position="absolute"
                      top="5px"
                      right="5px"
                      onClick={() => handleDeleteImage(index)}
                      style={{
                        cursor: "pointer",
                        backgroundColor: "rgba(255,255,255,0.7)",
                        borderRadius: "50%",
                      }}
                      aria-label={`Delete Customer Image ${index + 1}`}
                    />
                  </Box>
                ))}
              </Box>
            )}
            <Hr margin="15px 0px 15px 0px" width="1200px" />

            {/* Audio Recording Section */}
            <Text margin="15px 0px 15px 0px">Audio</Text>
            
            <Hr margin="15px 0px 15px 0px" width="1200px" />

            {/* Deadline Section (Optional) */}
            <Text margin="15px 0px 15px 0px">Deadline</Text>
            <Input
              type="date"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              width="40%"
              background="white"
              padding="5px"
              margin="0 10px"
              required
              aria-label="Deadline Date"
            />
            <Hr margin="15px 0px 15px 0px" width="1200px" />

            {/* Save Button */}
            <Button
              onClick={handleSaveCustomer}
              margin="40px 0"
              background="#cb7731"
              color="white"
              padding="10px 20px"
              border-radius="7.5px"
              aria-label="Save Customer Changes"
            >
              Save Changes
            </Button>
          </Box>
          {/* End Fixed-Width Container */}
        </Box>

        {/* Image Modal */}
        {modalOpen && (
          <div
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              width: "100%",
              height: "100%",
              backgroundColor: "rgba(0,0,0,0.8)",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              zIndex: 1000,
            }}
            onClick={closeModal}
          >
            <img
              src={modalImageUrl}
              alt="Full Size"
              style={{ maxHeight: "90%", maxWidth: "90%" }}
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        )}
      </Section>
    </Theme>
  );
};
