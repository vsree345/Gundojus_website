import React, { useState, useEffect } from "react";
import theme from "theme";
import {
  Theme,
  Text,
  Input,
  Box,
  Section,
  Progress,
} from "@quarkly/widgets";
import { Helmet } from "react-helmet";
import { GlobalQuarklyPageStyles } from "global-page-styles";
import { fetchOrderById } from "./firebaseConfig"; // Import the function to fetch order data from Firebase
import { useLocation } from "react-router-dom";

// Helper function to extract UUID from the URL
const useQuery = () => {
  return new URLSearchParams(useLocation().search);
};

export default () => {
  const query = useQuery();
  const uuid = query.get("uuid"); // Extract UUID from URL
  const [orderData, setOrderData] = useState(null); // To store the fetched order data
  const [loading, setLoading] = useState(true); // Add loading state
  const [error, setError] = useState(null); // Add error state

  // Fetch order details on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        if (uuid) {
          fetchOrderById(uuid, (data) => {
            if (data) {
              console.log(data);
              setOrderData(data); // Set the fetched data into state
            } else {
              setError("Order not found.");
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
  

  // Show loading message if data is not yet fetched
  if (loading) {
    return <Text>Loading order details...</Text>;
  }

  if (error) {
    return <Text>{error}</Text>; // Display error if occurred
  }

  // Map the progress to numeric values for progress bar
  const progressLevels = {
    "Pending": 0,
    "In Progress": 50,
    "Completed": 100,
  };

  return (
    <Theme theme={theme}>
      <GlobalQuarklyPageStyles pageUrl={"orders-view"} />
      <Helmet>
        <title>View Order</title>
        <meta name={"description"} content={"View an existing order"} />
      </Helmet>

      <Section padding="90px 0 100px 0" quarkly-title="View-Order">
        <Box display="flex" align-items="center" justify-content="center" position="relative">
          <Text margin="0px 0px 20px 0px" text-align="center" font="normal 500 56px/1.2 --fontFamily-serifGeorgia" color="--dark" sm-margin="0px 0px 30px 0px">
            Order Details
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
            value={orderData.customer_name || ""}
            readOnly
          />

          <Text margin="15px 0px 15px 0px">Phone Number</Text>
          <Input
            display="block"
            placeholder-color="LightGray"
            background="white"
            border-color="--color-darkL2"
            border-radius="7.5px"
            width="50%"
            value={orderData.phone_number || ""}
            readOnly
          />

          <Text margin="15px 0px 15px 0px">Number of Pieces</Text>
          <Input
            display="block"
            placeholder-color="LightGray"
            background="white"
            border-color="--color-darkL2"
            border-radius="7.5px"
            width="50%"
            value={orderData.pieces?.number_of_pieces || 0}
            readOnly
          />

          <Text margin="15px 0px 15px 0px">Progress</Text>

        </Box>
      </Section>
    </Theme>
  );
};
