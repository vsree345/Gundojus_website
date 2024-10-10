import React, { useState, useEffect } from "react";
import theme from "theme";
import {
  Theme,
  Text,
  Icon,
  Box,
  Section,
  Strong,
  Input,
} from "@quarkly/widgets"; // Added Input
import { Helmet } from "react-helmet";
import { GlobalQuarklyPageStyles } from "global-page-styles";
import { MdCreate, MdDeleteSweep, MdNoteAdd, MdSearch } from "react-icons/md"; // Added MdSearch
import { useHistory } from "react-router-dom";
import { getDatabase, ref as dbRef, onValue } from "firebase/database";
import { deleteOrderById } from "../utils/firebaseConfig";
import { NavBar } from "../utils/navbar";
import Footer from "../utils/footer";
// Normalize phone number by removing non-digit characters
const normalizePhoneNumber = (phone) => {
  return String(phone).replace(/\D/g, "");
};

// Fetch orders from Firebase Realtime Database
const fetchOrders = (setOrders) => {
  const db = getDatabase();
  const ordersRef = dbRef(db, "orders");

  onValue(ordersRef, (snapshot) => {
    const data = snapshot.val();
    if (data) {
      const ordersArray = Object.keys(data).map((key) => ({
        uuid: key,
        ...data[key],
      }));
      setOrders(ordersArray);
    }
  });
};

// Function to delete an order and reload the page
const deleteOrder = async (uuid) => {
  try {
    await deleteOrderById(uuid); // Deletes the order from Firebase Database
    window.location.reload(); // Forces page reload after successful deletion
  } catch (error) {
    console.error("Error deleting order: ", error);
    alert("Failed to delete the order. Please try again.");
  }
};

export default () => {
  const [orders, setOrders] = useState([]); // State to store all orders
  const [searchTerm, setSearchTerm] = useState(""); // State for search input
  const history = useHistory();

  // Fetch all orders on component mount
  useEffect(() => {
    fetchOrders(setOrders);
  }, []);

  // Handle editing an order
  const editOrder = (uuid) => {
    history.push(`/orders/edit?uuid=${uuid}`);
  };

  // Handle deleting an order
  const handleDelete = (uuid) => {
    if (window.confirm("Are you sure you want to delete this order?")) {
      deleteOrder(uuid);
    }
  };

  // Normalize phone number by removing non-digit characters
  const normalizePhoneNumberFn = (phone) => {
    return String(phone).replace(/\D/g, "");
  };

  // Filter orders based on search term (customer_name or phone_number)
  const filteredOrders = orders.filter((order) => {
    try {
      if (!order) return false;

      const nameField = String(order.customer_name || "")
        .toLowerCase()
        .trim();
      const term = String(searchTerm || "")
        .toLowerCase()
        .trim();
      const nameMatch = nameField.includes(term);

      const phoneField = String(order.phone_number || order.phone || ""); // Adjust field names as necessary
      const normalizedPhoneField = normalizePhoneNumberFn(phoneField);
      const normalizedSearchTerm = normalizePhoneNumberFn(term);

      let phoneMatch = false;
      if (normalizedSearchTerm !== "") {
        phoneMatch = normalizedPhoneField.includes(normalizedSearchTerm);
      }

      return nameMatch || phoneMatch;
    } catch (error) {
      console.error("Error filtering orders:", error);
      return false;
    }
  });

  // Determine the color of the status text based on the order's progress
  const getStatusColor = (progress) => {
    if (progress === "Completed") return "#31a931"; // Green for completed
    if (progress === "In Progress") return "#ffaa00"; // Orange for in progress
    return "#ff0000"; // Red for others (e.g., Pending)
  };

  const addOrder = () => {
    history.push("/orders/add");
  };

  return (
    <Theme theme={theme}>
      <GlobalQuarklyPageStyles pageUrl={"orders-managers"} />
      <Helmet>
        <title>Orders Manager</title>
        <link
          rel={"shortcut icon"}
          href={"https://i.imgur.com/crcVWqA.png"}
          type={"image/x-icon"}
        />
      </Helmet>

      <NavBar role={sessionStorage.getItem("role")} current={"Orders"} />

      <Section padding="90px 0 100px 0" quarkly-title="Orders-Manager">
        
        <Text
          margin="0px 0px 20px 0px"
          text-align="center"
          font="normal 500 56px/1.2 --fontFamily-serifGeorgia"
          color="--dark"
          sm-margin="0px 0px 30px 0px"
        >
          Orders
        </Text>

        <Icon
          category="md"
          icon={MdNoteAdd}
          onClick={() => addOrder()}
          size="32px"
          align-self="flex-end"
          margin="16px 0px 16px 0px"
          style={{ cursor: "pointer" }}
        />

        {/* Search Bar */}
        <Box
          display="flex"
          justify-content="center"
          align-items="center"
          margin="0px 0px 20px 0px"
        >
          <Input
            type="text"
            placeholder="Search by customer name or phone number"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            width="50%"
            padding="8px 12px"
            border="1px solid #ccc"
            border-radius="4px"
            margin-right="10px"
          />
          {/* <Icon
            category="md"
            icon={MdSearch}
            size="24px"
            color="#555"
            style={{ cursor: "pointer" }}
            onClick={() => {
              // Optional: You can implement additional functionality on search icon click
            }}
          /> */}
        </Box>

        {/* Begin Fixed-Width Container */}
        <Box
          min-width="1200px"
          overflow="auto"
          margin="0 auto"
          padding="0 10px" // Optional: Add horizontal padding
        >
          {/* Header Row */}
          <Box
            display="flex"
            justify-content="space-between"
            align-items="center"
            padding="10px"
            border-width="0 0 2px 0"
            border-style="solid"
            border-color="#d1d7de"
            margin="0px 0px 10px 0px"
          >
            <Text width="20%" text-align="center" font="--lead" color="--dark">
              <Strong>Order Time</Strong>
            </Text>
            <Text width="25%" text-align="center" font="--lead" color="--dark">
              <Strong>Customer Name</Strong>
            </Text>
            <Text width="15%" text-align="center" font="--lead" color="--dark">
              <Strong>Status</Strong>
            </Text>
            <Text width="10%" text-align="center" font="--lead" color="--dark">
              <Strong>Pieces</Strong>
            </Text>
            <Text width="20%" text-align="center" font="--lead" color="--dark">
              <Strong>Deadline</Strong>
            </Text>
            <Text width="5%" text-align="center" font="--lead" color="--dark">
              <Strong>Edit</Strong>
            </Text>
            <Text width="5%" text-align="center" font="--lead" color="--dark">
              <Strong>Delete</Strong>
            </Text>
          </Box>

          {filteredOrders.length > 0 ? (
            <Box>
              {filteredOrders.map((order) => (
                <Box
                  key={order.uuid}
                  display="flex"
                  justify-content="space-between"
                  align-items="center"
                  padding="10px"
                  border-width="0 0 1px 0"
                  border-style="solid"
                  border-color="#d1d7de"
                  background="#ffffff"
                  margin="0px 0px 10px 0px"
                >
                  {/* Order Time */}
                  <Text
                    width="20%"
                    text-align="center"
                    font="normal 400 16px/1.5 -apple-system, system-ui, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif"
                    color="--dark"
                  >
                    {order.orderCreationDate} / {order.orderCreationTime}
                  </Text>

                  {/* Order Name */}
                  <Text
                    width="25%"
                    text-align="center"
                    font="normal 500 28px/1.2 --fontFamily-serifGeorgia"
                    color="--dark"
                  >
                    {order.customer_name}
                  </Text>

                  {/* Status with Conditional Color */}
                  <Text
                    width="15%"
                    text-align="center"
                    font="normal 400 16px/1.5 -apple-system, system-ui, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif"
                    color={getStatusColor(order.progress)}
                  >
                    <Strong>{order.progress}</Strong>
                  </Text>

                  {/* Pieces */}
                  <Text
                    width="10%"
                    text-align="center"
                    font="normal 400 16px/1.5 -apple-system, system-ui, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif"
                    color="--dark"
                  >
                    {order.pieces?.number_of_pieces || "N/A"}
                  </Text>

                  {/* Deadline */}
                  <Text
                    width="20%"
                    text-align="center"
                    font="normal 400 16px/1.5 -apple-system, system-ui, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif"
                    color="--dark"
                  >
                    {order.deadline_formatted || "N/A"}
                  </Text>

                  {/* Edit Icon */}
                  <Box
                    width="5%"
                    display="flex"
                    justify-content="center"
                    align-items="center"
                  >
                    <Icon
                      category="md"
                      icon={MdCreate}
                      size="32px"
                      margin="0px"
                      onClick={() => editOrder(order.uuid)}
                      style={{ cursor: "pointer" }}
                    />
                  </Box>

                  {/* Delete Icon */}
                  <Box
                    width="5%"
                    display="flex"
                    justify-content="center"
                    align-items="center"
                  >
                    <Icon
                      category="md"
                      icon={MdDeleteSweep}
                      size="32px"
                      margin="0px"
                      onClick={() => handleDelete(order.uuid)}
                      style={{ cursor: "pointer" }}
                    />
                  </Box>
                </Box>
              ))}
            </Box>
          ) : (
            <Text>No orders available</Text>
          )}
        </Box>
        {/* End Fixed-Width Container */}
      </Section>
      <Footer />
    </Theme>
  );
};
