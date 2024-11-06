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
  fetchOrderById,
  editOrderById,
  uploadImage,
  uploadAudio,
} from "./firebaseConfig"; // Import Firebase functions
import { useHistory, useLocation } from "react-router-dom";
import { FaWhatsapp } from "react-icons/fa";

// Helper function to extract the UUID from the URL query string
const useQuery = () => {
  return new URLSearchParams(useLocation().search);
};

export default () => {
  const history = useHistory();
  const query = useQuery();
  const uuid = query.get("uuid"); // Extract UUID from URL
  const [orderData, setOrderData] = useState(null); // To store fetched order data
  const [pieces, setPieces] = useState([]); // For pieces list
  const [progress, setProgress] = useState(""); // To track the progress status
  const [loading, setLoading] = useState(true); // Add loading state
  const [error, setError] = useState(null); // Add error state
  const [imageUrls, setImageUrls] = useState([]); // For storing image URLs
  const [audioURL, setAudioURL] = useState(null); // For storing audio URLs
  const [modalOpen, setModalOpen] = useState(false); // For modal state
  const [modalImageUrl, setModalImageUrl] = useState(""); // For the image in modal
  const [deadline, setDeadline] = useState(""); // For storing the deadline date

  const convertToInputDateFormat = (dateString) => {
    // Parse the date string, e.g., "November 8, 2024"
    const parsedDate = new Date(dateString);

    // Format as YYYY-MM-DD for input date compatibility
    const year = parsedDate.getFullYear();
    const month = String(parsedDate.getMonth() + 1).padStart(2, "0"); // Months are 0-indexed
    const day = String(parsedDate.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
  };

  // Fetch order details on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        if (uuid) {
          fetchOrderById(uuid, (data) => {
            if (data) {
              setOrderData(data);
              setPieces(data?.pieces?.details || []);
              setProgress(data?.progress || "Pending");
              setImageUrls(data.images || []);
              setAudioURL(data.audio_link || null);
              setDeadline(convertToInputDateFormat(data.deadline_raw) || ""); // Set deadline if available
            } else {
              setError("Order not found or invalid UUID.");
            }
            setLoading(false);
          });
        } else {
          setError("Invalid order UUID.");
          setLoading(false);
        }
      } catch (err) {
        setError("Error fetching order data.");
        setLoading(false);
      }
    };
    fetchData();
  }, [uuid]);

  // Handle file upload for additional images
  const handleFileUpload = async (files) => {
    try {
      const uploadedImageUrls = await Promise.all(
        files.map((file) => uploadImage(file))
      );
      setImageUrls((prevUrls) => [...prevUrls, ...uploadedImageUrls]);
    } catch (error) {
      console.error("Error uploading images:", error);
    }
  };

  // Handle audio upload
  const handleAudioUpload = async (audioBlob) => {
    try {
      const audioLink = await uploadAudio(audioBlob);
      setAudioURL(audioLink);
    } catch (error) {
      console.error("Error uploading audio:", error);
    }
  };

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
        >
          Upload Images
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

  // Audio Recorder Component
  const AudioRecorder = ({ handleAudioUpload }) => {
    const [isRecording, setIsRecording] = useState(false);
    const [audioURL, setAudioURL] = useState("");
    const mediaRecorderRef = useRef(null);
    const audioChunks = useRef([]);

    const handleStartRecording = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const mediaRecorder = new MediaRecorder(stream);
        mediaRecorderRef.current = mediaRecorder;

        mediaRecorder.ondataavailable = (event) => {
          audioChunks.current.push(event.data);
        };

        mediaRecorder.onstop = async () => {
          const audioBlob = new Blob(audioChunks.current, { type: "audio/wav" });
          const audioLink = await handleAudioUpload(audioBlob);
          setAudioURL(audioLink);
          audioChunks.current = [];
        };

        mediaRecorder.start();
        setIsRecording(true);
      } catch (error) {
        console.error("Error accessing microphone:", error);
        alert("Error accessing microphone");
      }
    };

    const handleStopRecording = () => {
      if (mediaRecorderRef.current) {
        mediaRecorderRef.current.stop();
        setIsRecording(false);
      }
    };

    return (
      <>
        <Button
          margin="20px 0"
          background="#cb7731"
          color="white"
          padding="10px 20px"
          border-radius="7.5px"
          onClick={isRecording ? handleStopRecording : handleStartRecording}
        >
          {isRecording ? "Stop Recording" : "Record Audio"}
        </Button>
        {audioURL && (
          <audio controls>
            <source src={audioURL} type="audio/wav" />
            Your browser does not support the audio element.
          </audio>
        )}
      </>
    );
  };

  // Function to format phone number for WhatsApp API
  const formatPhoneNumber = (phone) => {
    // Remove any non-digit characters
    return phone.replace(/\D/g, "");
  };

  // Handle WhatsApp click
  const handleWhatsAppClick = () => {
    const message = `Your order has been confirmed.\nVisit gundojus.in/orders/view?uuid=${uuid} to check the progress.\n\n- Sujatha Reddy`;
    const phoneNumber = formatPhoneNumber(orderData.phone_number);
    const url = `https://api.whatsapp.com/send?phone=${phoneNumber}&text=${encodeURIComponent(
      message
    )}`;
    window.open(url, "_blank");
  };

  // Handle updating order data in Firebase
  const handleSaveOrder = async () => {
    try {
      const convertToReadableDate = (inputDate) => {
        // Parse the input date string
        const date = new Date(inputDate);

        // Array of month names
        const monthNames = [
          "January",
          "February",
          "March",
          "April",
          "May",
          "June",
          "July",
          "August",
          "September",
          "October",
          "November",
          "December",
        ];

        // Get day, month, and year
        const day = date.getDate();
        const month = monthNames[date.getMonth()]; // Get the month name
        const year = date.getFullYear();

        return `${month} ${day}, ${year}`;
      };

      const updatedOrderData = {
        ...orderData,
        pieces: {
          ...orderData.pieces,
          details: pieces,
          number_of_pieces: totalPieces,
        },
        progress,
        images: imageUrls, // Include updated images array
        audio_link: audioURL, // Include audio URL
        deadline_raw: deadline, // Include deadline in YYYY-MM-DD format
        deadline_formatted: convertToReadableDate(deadline), // Include deadline formatted
      };
      await editOrderById(uuid, updatedOrderData);
      alert("Order updated successfully");
      history.push("/orders");
    } catch (err) {
      alert("Error updating order. Please try again.");
    }
  };

  // Add a new piece row
  const addPieceRow = () => {
    setPieces([...pieces, { type: "Lehenga", quantity: 1, remarks: "" }]);
  };

  // Remove a piece row
  const removePieceRow = (index) => {
    setPieces(pieces.filter((_, i) => i !== index));
  };

  const handleTypeChange = (index, value) => {
    const updatedPieces = pieces.map((piece, i) =>
      i === index ? { ...piece, type: value } : piece
    );
    setPieces(updatedPieces);
  };

  const handleQuantityChange = (index, value) => {
    const updatedPieces = pieces.map((piece, i) =>
      i === index ? { ...piece, quantity: Number(value) } : piece
    );
    setPieces(updatedPieces);
  };

  const handleRemarksChange = (index, value) => {
    const updatedPieces = pieces.map((piece, i) =>
      i === index ? { ...piece, remarks: value } : piece
    );
    setPieces(updatedPieces);
  };

  const totalPieces = pieces.reduce((acc, piece) => acc + piece.quantity, 0);

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
    return <Text>Loading...</Text>;
  }

  if (error) {
    return <Text>{error}</Text>;
  }

  return (
    <Theme theme={theme}>
      <GlobalQuarklyPageStyles pageUrl={"orders-edit"} />
      <Helmet>
        <title>Edit Order</title>
        <meta name={"description"} content={"Edit an existing order"} />
      </Helmet>

      <Section padding="90px 0 100px 0" quarkly-title="Schedule-5">
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
            onClick={() => history.push("/orders")}
            style={{ cursor: "pointer", position: "absolute", left: "0" }}
          />
          <Text
            margin="0px 0px 20px 0px"
            text-align="center"
            font="normal 500 56px/1.2 --fontFamily-serifGeorgia"
            color="--dark"
            sm-margin="0px 0px 30px 0px"
          >
            Edit Order
          </Text>
        </Box>

        <Box min-width="100px" min-height="100px" padding="15px 0px 15px 0px">
          <Box display="flex" align-items="center" margin="15px 0px 15px 0px">
            <Text margin="0">Customer Name</Text>
            <FaWhatsapp
              size="24px"
              style={{ cursor: "pointer", marginLeft: "10px" }}
              onClick={handleWhatsAppClick}
            />
          </Box>
          <Input
            display="block"
            background="white"
            border-color="--color-darkL2"
            border-radius="7.5px"
            width="50%"
            value={orderData.customer_name || ""}
            readOnly
          />
          <Hr margin="15px 0px 15px 0px" width="1200px" />

          <Text margin="15px 0px 15px 0px">Phone Number</Text>
          <Input
            display="block"
            background="white"
            border-color="--color-darkL2"
            border-radius="7.5px"
            width="50%"
            value={orderData.phone_number || ""}
            readOnly
          />
          <Hr margin="15px 0px 15px 0px" width="1200px" />

          <Text margin="15px 0px 15px 0px">Progress</Text>
          <Select
            value={progress}
            onChange={(e) => setProgress(e.target.value)}
            background="white"
            width="50%"
            padding="5px"
            border-radius="7.5px"
          >
            <option value="Pending">Pending</option>
            <option value="In Progress">In Progress</option>
            <option value="Completed">Completed</option>
          </Select>
          <Hr margin="15px 0px 15px 0px" width="1200px" />

          <Box
            display="flex"
            align-items="center"
            justify-content="space-between"
          >
            <Text margin="15px 0px 15px 0px">Add Pieces</Text>
            <Icon
              category="md"
              icon={MdNoteAdd}
              size="32px"
              margin="16px 0px 16px 0px"
              onClick={addPieceRow}
              style={{ cursor: "pointer" }}
            />
          </Box>
          {pieces.map((piece, index) => (
            <Box key={index} display="flex" align-items="center" margin="10px 0">
              <Text width="5%" textAlign="center">
                {index + 1}
              </Text>
              <Select
                value={piece.type}
                onChange={(e) => handleTypeChange(index, e.target.value)}
                background="white"
                width="20%"
                padding="5px"
                margin="0 10px"
              >
                <option value="Lehenga">Lehenga</option>
                <option value="Saree">Saree</option>
                <option value="Kurti">Kurti</option>
                <option value="Western">Western</option>
              </Select>
              <Input
                type="number"
                value={piece.quantity}
                onChange={(e) => handleQuantityChange(index, e.target.value)}
                width="20%"
                min="1"
                background="white"
                padding="5px"
                margin="0 10px"
              />
              <Input
                type="text"
                placeholder="Remarks"
                value={piece.remarks}
                onChange={(e) => handleRemarksChange(index, e.target.value)}
                width="40%"
                background="white"
                padding="5px"
                margin="0 10px"
              />
              <Icon
                category="md"
                icon={MdDeleteSweep}
                size="32px"
                margin="0px 15px"
                onClick={() => removePieceRow(index)}
                style={{ cursor: "pointer" }}
              />
            </Box>
          ))}
          <Text margin="15px 0px 15px 0px">Total Pieces: {totalPieces}</Text>
          <Hr margin="15px 0px 15px 0px" width="1200px" />

          <Text margin="15px 0px 15px 0px">Images</Text>
          <FileUploader handleFile={handleFileUpload} />
          {imageUrls.length > 0 && (
            <Box display="flex" flex-wrap="wrap">
              {imageUrls.map((url, index) => (
                <img
                  key={index}
                  src={url}
                  alt={`Order Image ${index + 1}`}
                  style={{
                    width: "150px",
                    height: "150px",
                    margin: "10px",
                    cursor: "pointer",
                    objectFit: "cover",
                  }}
                  onClick={() => openImageInModal(url)}
                />
              ))}
            </Box>
          )}
          <Hr margin="15px 0px 15px 0px" width="1200px" />

          <Text margin="15px 0px 15px 0px">Audio</Text>
          {!audioURL && <AudioRecorder handleAudioUpload={handleAudioUpload} />}
          {audioURL && (
            <audio controls style={{ margin: "10px 0" }}>
              <source src={audioURL} />
              Your browser does not support the audio element.
            </audio>
          )}
          <Hr margin="15px 0px 15px 0px" width="1200px" />

          <Text margin="15px 0px 15px 0px">Deadline</Text>
          <Input
            type="date"
            value={deadline}
            onChange={(e) => setDeadline(e.target.value)}
            width="40%"
            background="white"
            padding="5px"
          />
          <Hr margin="15px 0px 15px 0px" width="1200px" />

          <Button
            onClick={handleSaveOrder}
            margin="40px 0"
            background="#cb7731"
            color="white"
            padding="10px 20px"
            border-radius="7.5px"
          >
            Save Changes
          </Button>
        </Box>
      </Section>

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
    </Theme>
  );
};
