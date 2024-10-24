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
} from "./firebaseConfig";
import { useHistory } from "react-router-dom";
import * as Components from "components";

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
  const whatsappAPIUrl = `https://api.whatsapp.com/send?phone=${phoneNumber}&text=${encodeURIComponent(
    message
  )}`;
  window.open(whatsappAPIUrl, "_blank");
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

export default () => {
  const [customerName, setCustomerName] = useState("");
  const [countryCode, setCountryCode] = useState("+91");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [images, setImages] = useState([]);
  const [pieces, setPieces] = useState([]);
  const [audioLink, setAudioLink] = useState(""); // To store audio URL
  const [deadlineDate, setDeadlineDate] = useState(null); // Added state for deadline date
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
    }
  };

  // Handle audio upload and return the uploaded audio URL
  const handleAudioUpload = async (audioBlob) => {
    const audioURL = await uploadAudio(audioBlob);
    setAudioLink(audioURL);
    return audioURL;
  };

  // Add a new piece row
  const addPieceRow = () => {
    setPieces([...pieces, { type: "Lehenga", quantity: 1, remarks: "" }]);
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

  // Submit the order
  const handleSubmitOrder = async () => {
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
      deadline: deadlineDate, // Include the formatted deadline date
    };

    // Save order to Firebase Realtime Database
    await saveOrderToDatabase(orderData);

    // Send WhatsApp message
    sendWhatsAppMessage(`${countryCode}${phoneNumber}`, orderUUID);

    // Redirect to orders page
    history.push("/orders");
  };

  // Function to get ordinal suffix
  const getOrdinalSuffix = (n) => {
    const s = ["th", "st", "nd", "rd"],
      v = n % 100;
    return n + (s[(v - 20) % 10] || s[v] || s[0]);
  };

  return (
    <Theme theme={theme}>
      <GlobalQuarklyPageStyles pageUrl={"orders-customers"} />
      <Helmet>
        <title>Add Order</title>
        <meta
          name={"description"}
          content={"Web site created using quarkly.io"}
        />
        <link
          rel={"shortcut icon"}
          href={"https://uploads.quarkly.io/readme/cra/favicon-32x32.ico"}
          type={"image/x-icon"}
        />
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
            New Order
          </Text>
        </Box>

        <Box min-width="100px" min-height="100px" padding="15px 0px 15px 0px">
          <Text margin="15px 0px 15px 0px">Customer Name</Text>
          <Input
            display="block"
            placeholder-color="LightGray"
            background="white"
            border-color="--color-darkL2"
            border-radius="7.5px"
            width="50%"
            required
            onChange={(e) => setCustomerName(e.target.value)}
          />
          <Hr
            min-height="10px"
            min-width="100%"
            margin="15px 0px 15px 0px"
            border-color="--color-darkL2"
            width="1200px"
          />

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
              defaultValue="+91"
              border-color="--color-darkL2"
              width="4%"
              padding="6px 8px"
              border-radius="7.5px"
              margin="0px 4px 0px 0px"
              required
              onChange={(e) => setCountryCode(e.target.value)}
            />
            <Input
              display="grid"
              background="white"
              border-color="--color-darkL2"
              border-radius="7.5px"
              required
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
                  as="img"
                  // Check if the image is a File object or already uploaded (URL string)
                  src={
                    image instanceof File ? URL.createObjectURL(image) : image
                  }
                  width="225px"
                  height="225px"
                  object-fit="cover"
                />
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
          <AudioRecorder handleAudioUpload={handleAudioUpload} />

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
                    <option value="Lehenga">Lehenga</option>
                    <option value="Saree">Saree</option>
                    <option value="Kurti">Kurti</option>
                    <option value="Western">Western</option>
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
                    onChange={(e) =>
                      handleRemarksChange(index, e.target.value)
                    }
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
          <Components.QuarklycommunityKitDateSingleInput
            required
            onChange={(value) => {
              const selectedDate = new Date(value);

              const day = selectedDate.getDate();
              const month = selectedDate.toLocaleString("default", {
                month: "long",
              });
              const year = selectedDate.getFullYear();

              const formattedDate = `${getOrdinalSuffix(day)} ${month}, ${year}`;

              console.log(formattedDate); // Console log the formatted date

              setDeadlineDate(formattedDate); // Set the formatted deadline date
            }}
          >
            <Override
              slot="Input"
              border-color="--color-darkL2"
              border-radius="7.5px"
            />
          </Components.QuarklycommunityKitDateSingleInput>

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
    </Theme>
  );
};
