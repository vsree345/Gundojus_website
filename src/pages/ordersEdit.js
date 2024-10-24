import React, { useState, useEffect } from "react";
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
import { fetchOrderById, saveOrderToDatabase } from "./firebaseConfig"; // Import Firebase functions
import { useHistory, useLocation } from "react-router-dom";

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

  // Fetch order details on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        if (uuid) {
          // Call the updated fetchOrderById function
          fetchOrderById(uuid, (data) => {
            if (data) {
              setOrderData(data); // Set the fetched order data into state
              setPieces(data?.pieces?.details || []); // Set the pieces data
              setProgress(data?.progress || "Pending"); // Set the order progress status
            } else {
              setError("Order not found or invalid UUID.");
            }
            setLoading(false); // Set loading to false after fetching
          });
        } else {
          setError("Invalid order UUID.");
          setLoading(false); // Set loading to false if UUID is invalid
        }
      } catch (err) {
        setError("Error fetching order data.");
        setLoading(false); // Set loading to false if an error occurs
      }
    };
  
    fetchData();
  }, [uuid]);
  

  // Handle updating order data in Firebase
  const handleSaveOrder = async () => {
    try {
      const updatedOrderData = {
        ...orderData,
        pieces: { ...orderData.pieces, details: pieces }, // Updating pieces
        progress: progress, // Updating progress status
      };
      await saveOrderToDatabase(updatedOrderData);
      alert("Order updated successfully");
      history.push("/orders"); // Redirect to /orders page
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

  // Handle updates in the piece's type, quantity, and remarks
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

  if (loading) {
    return <Text>Loading...</Text>; // Display loading if data hasn't been fetched yet
  }

  if (error) {
    return <Text>{error}</Text>; // Display error message if an error occurred
  }

  return (
    <Theme theme={theme}>
      <GlobalQuarklyPageStyles pageUrl={"orders-edit"} />
      <Helmet>
        <title>Edit Order</title>
        <meta name={"description"} content={"Edit an existing order"} />
      </Helmet>

      <Section padding="90px 0 100px 0" quarkly-title="Schedule-5">
        <Box display="flex" align-items="center" justify-content="center" position="relative">
          <Icon
            category="md"
            icon={MdArrowBack}
            size="40px"
            margin="16px"
            padding="0px 0px 16px 0px"
            onClick={() => history.push("/orders")} // Go back to orders page
            style={{ cursor: "pointer", position: "absolute", left: "0" }}
          />
          <Text margin="0px 0px 20px 0px" text-align="center" font="normal 500 56px/1.2 --fontFamily-serifGeorgia" color="--dark" sm-margin="0px 0px 30px 0px">
            Edit Order
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
            value={orderData.customer_name || ""}
            readOnly
          />
          <Hr min-height="10px" min-width="100%" margin="15px 0px 15px 0px" border-color="--color-darkL2" width="1200px" />

          <Text margin="15px 0px 15px 0px">Phone Number</Text>
          <Input
            display="block"
            placeholder-color="LightGray"
            background="white"
            border-color="--color-darkL2"
            border-radius="7.5px"
            width="50%"
            required
            value={orderData.phone_number || ""}
            readOnly
          />
          <Hr min-height="10px" min-width="100%" margin="15px 0px 15px 0px" border-color="--color-darkL2" width="1200px" />

          {/* Progress Dropdown */}
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
          <Hr min-height="10px" min-width="100%" margin="15px 0px 15px 0px" border-color="--color-darkL2" width="1200px" />

          {/* Pieces Section */}
          <Box display="flex" align-items="center" justify-content="space-between">
            <Text margin="15px 0px 15px 0px">Edit Pieces</Text>
            <Icon category="md" icon={MdNoteAdd} size="32px" margin="16px 0px 16px 0px" onClick={addPieceRow} style={{ cursor: "pointer" }} />
          </Box>

          {pieces.length > 0 && (
            <>
              {pieces.map((piece, index) => (
                <Box key={index} display="flex" align-items="center" margin="10px 0">
                  <Text width="5%" textAlign="center">{index + 1}</Text>
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
            </>
          )}

          <Hr min-height="10px" min-width="100%" margin="15px 0px 15px 0px" border-color="--color-darkL2" width="1200px" />
          
          <Button onClick={handleSaveOrder} margin="40px 0" background="#cb7731" color="white" padding="10px 20px" border-radius="7.5px">
            Save Changes
          </Button>
        </Box>
      </Section>
    </Theme>
  );
};
