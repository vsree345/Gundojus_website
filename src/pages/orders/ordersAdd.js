// Import necessary modules and components
import React, { useState, useRef } from "react";
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
import { Override } from "@quarkly/components";
import { Helmet } from "react-helmet";
import { GlobalQuarklyPageStyles } from "global-page-styles";
import { MdDeleteSweep, MdNoteAdd, MdArrowBack } from "react-icons/md";
import {
  uploadImage,
  uploadAudio,
  saveOrderToDatabase,
} from "../utils/firebaseConfig";
import { useHistory } from "react-router-dom";
import Footer from "../utils/footer";
// UUID generation function
const generateUUID = () => {
  const characters =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < 7; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
};

// WhatsApp message sending function
const sendWhatsAppMessage = (phoneNumber, orderUUID) => {
  const message = `Hi, your order with UUID: ${orderUUID} has been successfully placed.`;
  console.log(
    `https://api.whatsapp.com/send?phone=${phoneNumber}&text=${encodeURIComponent(
      message
    )}`
  );
  // const whatsappAPIUrl = `https://api.whatsapp.com/send?phone=${phoneNumber}&text=${encodeURIComponent(
  //   message
  // )}`;
  // window.open(whatsappAPIUrl, "_blank");
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
const AudioRecorder = ({ handleAudioUpload, handleDeleteAudio, audioLink }) => {
  const [isRecording, setIsRecording] = useState(false);
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
      {audioLink && (
        <Box display="flex" align-items="center">
          <audio controls>
            <source src={audioLink} type="audio/wav" />
            Your browser does not support the audio element.
          </audio>
          <Icon
            category="md"
            icon={MdDeleteSweep}
            size="24px"
            color="#ff0000"
            margin="0 0 0 10px"
            onClick={handleDeleteAudio}
            style={{ cursor: "pointer" }}
            aria-label="Delete Audio"
          />
        </Box>
      )}
    </>
  );
};

export default () => {
  const [customerName, setCustomerName] = useState("");
  const [countryCode, setCountryCode] = useState("+91");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [images, setImages] = useState([]);
  const [pieces, setPieces] = useState([]);
  const [audioLink, setAudioLink] = useState(""); // To store audio URL
  const [deadlineDate, setDeadlineDate] = useState(new Date()); // Added state for deadline date
  const history = useHistory();

  // Handle file upload and store image paths
  const handleFileUpload = async (files) => {
    try {
      const uploadedImageUrls = await Promise.all(
        files.map((file) => uploadImage(file)) // Use uploadImage function
      );
      setImages((prevImages) => [...prevImages, ...uploadedImageUrls]); // Store URLs
    } catch (error) {
      console.error("Error uploading files:", error);
      alert("Failed to upload images. Please try again.");
    }
  };

  // Handle audio upload and return the uploaded audio URL
  const handleAudioUpload = async (audioBlob) => {
    try {
      const audioURL = await uploadAudio(audioBlob);
      setAudioLink(audioURL);
      return audioURL;
    } catch (error) {
      console.error("Error uploading audio:", error);
      alert("Failed to upload audio. Please try again.");
      return "";
    }
  };

  // Handle deleting an image
  const handleDeleteImage = (index) => {
    const updatedImages = images.filter((_, i) => i !== index);
    setImages(updatedImages);
  };

  // Handle deleting audio
  const handleDeleteAudio = () => {
    setAudioLink("");
  };

  // Add a new piece row
  const addPieceRow = () => {
    setPieces([...pieces, { type: "Blouse", quantity: 1, remarks: "" }]);
  };

  // Remove a piece row
  const removePieceRow = (index) => {
    setPieces(pieces.filter((_, i) => i !== index));
  };

  // Handle piece data updates
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

  const formatDateLocal = (date) => {
    const year = date.getFullYear();
    const month = `0${date.getMonth() + 1}`.slice(-2); // Months are zero-based
    const day = `0${date.getDate()}`.slice(-2);
    return `${year}-${month}-${day}`;
  };

  // Submit the order
  const handleSubmitOrder = async () => {
    // Validate form fields
    if (!customerName || !phoneNumber) {
      alert("Please fill in customer name and phone number.");
      return;
    }

    if (pieces.length === 0) {
      alert("Please add at least one piece.");
      return;
    }

    if (!deadlineDate) {
      alert("Please select a deadline date.");
      return;
    }

    // Get the current date and time
    const now = new Date();
    const orderCreationTime = now.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
    const orderCreationDate = now
      .toLocaleDateString("en-US", {
        day: "numeric",
        year: "numeric",
        month: "long",
      })
      .replace(/(\d+)(th|st|nd|rd)/, "$1th");

    // Generate UUID
    const orderUUID = generateUUID();

    // Filter out undefined or null images
    const validImages = images.filter(
      (image) => image !== undefined && image !== null
    );

    const deadline_raw = formatDateLocal(deadlineDate);
    const deadline_formatted = deadlineDate
      .toLocaleDateString("en-US", {
        day: "numeric",
        year: "numeric",
        month: "long",
      })
      .replace(/(\d+)(th|st|nd|rd)/, "$1th");
    // Prepare order data
    const orderData = {
      customer_name: customerName,
      phone_number: `${countryCode}${phoneNumber}`,
      images: validImages, // Ensure only valid image URLs are saved
      pieces: { number_of_pieces: totalPieces, details: pieces },
      audio_link: audioLink,
      orderCreationTime,
      orderCreationDate,
      progress: "Pending",
      uuid: orderUUID,
      deadline_raw: deadline_raw,
      deadline_formatted: deadline_formatted,
      // Include the formatted deadline date
    };
    // console.log(orderData);
    // Save order to Firebase Realtime Database
    try {
      await saveOrderToDatabase(orderData, orderUUID);
    } catch (error) {
      console.error("Error saving order to database:", error);
      alert("Failed to save order. Please try again.");
      return;
    }

    // Send WhatsApp message
    sendWhatsAppMessage(`${countryCode}${phoneNumber}`, orderUUID);

    // Redirect to orders page
    history.push("/orders");
  };

  return (
    <Theme theme={theme}>
      <GlobalQuarklyPageStyles pageUrl={"orders-customers"} />
      <Helmet>
        <title>Add Order</title>

        <link
          rel={"shortcut icon"}
          href={"https://i.imgur.com/crcVWqA.png"}
          type={"image/x-icon"}
        />
      </Helmet>

      {/* Main Content */}
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
            aria-label="Back to Orders"
          />
          <Text
            margin="0px 0px 20px 0px"
            text-align="center"
            font="normal 500 56px/1.2 --fontFamily-serifGeorgia"
            color="--dark"
            sm-margin="0px 0px 30px 0px"
          >
            New Order
          </Text>
        </Box>

        <Box min-width="100px" min-height="100px" padding="15px 0px 15px 0px">
          {/* Customer Name Input */}
          <Text margin="15px 0px 15px 0px">Customer Name</Text>
          <Input
            display="block"
            placeholder-color="LightGray"
            background="white"
            border-color="--color-darkL2"
            border-radius="7.5px"
            width="50%"
            required
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
          />
          <Hr
            min-height="10px"
            min-width="100%"
            margin="15px 0px 15px 0px"
            border-color="--color-darkL2"
            width="1200px"
          />

          {/* Phone Number Input */}
          <Text margin="15px 0px 15px 0px">Phone Number</Text>
          <Box
            min-width="100px"
            display="flex"
            align-items="center"
            padding="15px 0px 15px 0px"
          >
            <Input
              display="inline-block"
              background="white"
              value={countryCode}
              border-color="--color-darkL2"
              width="5%"
              padding="6px 8px"
              border-radius="7.5px"
              margin="0px 4px 0px 0px"
              required
              onChange={(e) => setCountryCode(e.target.value)}
            />
            <Input
              display="inline-block"
              background="white"
              border-color="--color-darkL2"
              border-radius="7.5px"
              required
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
            />
          </Box>

          {/* Image Upload Section */}
          <Text margin="15px 0px 15px 0px">Upload Images</Text>
          <FileUploader handleFile={handleFileUpload} />
          {images.length === 0 ? null : (
            <Box
              display="grid"
              grid-template-columns={`repeat(${Math.min(
                images.length,
                4
              )}, 225px)`}
              grid-auto-rows="225px"
              grid-gap="15px"
              width={`${
                Math.min(images.length, 4) * 225 +
                (Math.min(images.length, 4) - 1) * 15
              }px`}
              overflow="auto"
              padding="15px"
              border="1px solid #ccc"
              margin="15px 0"
            >
              {images.map((image, index) => (
                <Box
                  key={index}
                  as="div"
                  position="relative" // To position the delete icon
                >
                  {/* Image Thumbnail */}
                  <Box
                    as="img"
                    src={image instanceof File ? URL.createObjectURL(image) : image}
                    width="225px"
                    height="225px"
                    object-fit="cover"
                    border-radius="5px"
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
                    style={{ cursor: "pointer", backgroundColor: "rgba(255,255,255,0.7)", borderRadius: "50%" }}
                    aria-label={`Delete image ${index + 1}`}
                  />
                </Box>
              ))}
            </Box>
          )}

          <Hr
            min-height="10px"
            min-width="100%"
            margin="15px 0px 15px 0px"
            border-color="--color-darkL2"
            width="1200px"
          />

          {/* Audio Recording Section */}
          <Text margin="15px 0px 15px 0px">Record Audio</Text>
          <AudioRecorder
            handleAudioUpload={handleAudioUpload}
            handleDeleteAudio={handleDeleteAudio}
            audioLink={audioLink}
          />

          {/* Pieces Section */}
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
              aria-label="Add Piece"
            />
          </Box>

          {pieces.length > 0 && (
            <>
              {pieces.map((piece, index) => (
                <Box
                  key={index}
                  display="flex"
                  align-items="center"
                  margin="10px 0"
                >
                  <Text width="5%" textAlign="center">
                    {index + 1}
                  </Text>
                  <Select
                    value={piece.type}
                    onChange={(e) => handleTypeChange(index, e.target.value)}
                    background="white"
                    width="20%"
                    padding="5px"
                    fontSize="16px"
                    margin="0 10px"
                  >
                    <option value="Blouse">Blouse</option>
                    <option value="Lehenga">Lehenga</option>
                    <option value="Dress">Dress</option>
                    <option value="Peticoat">Peticoat</option>
                  </Select>
                  <Input
                    type="number"
                    value={piece.quantity}
                    onChange={(e) =>
                      handleQuantityChange(index, e.target.value)
                    }
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
                    size="24px"
                    color="#ff0000"
                    onClick={() => removePieceRow(index)}
                    style={{ cursor: "pointer" }}
                    aria-label={`Delete piece ${index + 1}`}
                  />
                </Box>
              ))}
              <Text margin="15px 0px 15px 0px">
                Total Pieces: {totalPieces}
              </Text>
            </>
          )}

          <Hr
            min-height="10px"
            min-width="100%"
            margin="15px 0px 15px 0px"
            border-color="--color-darkL2"
            width="1200px"
          />

          {/* Deadline Section */}
          <Text margin="15px 0px 15px 0px">Deadline</Text>
          <Input
            type="date"
            value={deadlineDate.toISOString().split("T")[0]}
            onChange={(e) => {
              setDeadlineDate(new Date(e.target.value));
            }}
            width="40%"
            background="white"
            padding="5px"
            margin="0 10px"
            required
          />
          <Hr
            min-height="10px"
            min-width="100%"
            margin="15px 0px 15px 0px"
            border-color="--color-darkL2"
            width="1200px"
          />
          {/* Submit Button */}
          <Button
            onClick={handleSubmitOrder}
            margin="40px 0"
            background="#cb7731"
            color="white"
            padding="10px 20px"
            border-radius="7.5px"
          >
            Submit Order
          </Button>
        </Box>
      </Section>
      <Footer />
    </Theme>
  );
};
