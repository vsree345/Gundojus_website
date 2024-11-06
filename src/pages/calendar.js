import React, { useState, useEffect } from "react";
import { Box, Text, Theme, Section } from "@quarkly/widgets";
import { Helmet } from "react-helmet";
import { useHistory } from "react-router-dom";
import theme from "theme";
import Calendar from 'react-calendar'; // Using react-calendar for a simple calendar display
import 'react-calendar/dist/Calendar.css'; // Default CSS for react-calendar
import './mobile-month-view.css'; // Custom CSS file to make it responsive
import { fetchOrdersByDate } from "./firebaseConfig"; // Import the fetchOrdersByDate function

const CalendarPage = () => {
  const [myEvents, setEvents] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [toastMessage, setToastMessage] = useState(null);
  const history = useHistory();

  // Function to format date as YYYY-MM-DD based on local timezone
  const formatDateLocal = (date) => {
    const year = date.getFullYear();
    const month = (`0${date.getMonth() + 1}`).slice(-2); // Months are zero-based
    const day = (`0${date.getDate()}`).slice(-2);
    return `${year}-${month}-${day}`;
};

  // Function to load orders for all dates in the current month
  const loadEventsForMonth = async (date) => {
    const startOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
    const endOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0);
    
    // Generate all dates in the current month in 'YYYY-MM-DD' format
    const datesInMonth = [];
    for (let d = new Date(startOfMonth); d <= endOfMonth; d.setDate(d.getDate() + 1)) {
      datesInMonth.push(formatDateLocal(d));
    }

    // Fetch orders for each date
    const allOrders = [];
    for (const dateStr of datesInMonth) {
      const orders = await fetchOrdersByDate(dateStr);
      if (orders.length > 0) {
        allOrders.push(...orders);
      }
    }

    setEvents(allOrders);
  };

  useEffect(() => {
    // Load events when the component mounts and whenever the month changes
    loadEventsForMonth(selectedDate);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDate]);

  // Function to filter events for the selected date
  const getEventsForDate = (date) => {
    const formattedDate = formatDateLocal(date); // "YYYY-MM-DD"
    return myEvents.filter(event => event.deadline === formattedDate);
  };

  // Function to handle date selection
  const onDateChange = (date) => {
    setSelectedDate(date);
    const events = getEventsForDate(date);
    setToastMessage(events.length ? `You have ${events.length} order(s) on ${date.toDateString()}` : "No events on this day");
  };

  // Function to add markers on dates with events
  const tileContent = ({ date, view }) => {
    if (view === 'month') {
      const events = getEventsForDate(date);
      if (events.length > 0) {
        return (
          <Box
            width="8px"
            height="8px"
            borderRadius="50%"
            background="red"
            margin="0 auto"
            marginTop="2px"
          />
        );
      }
    }
    return null;
  };

  return (
    <Theme theme={theme}>
      <Helmet>
        <title>Calendar</title>
        <meta name="description" content="Order Calendar" />
      </Helmet>

      {/* Navigation Header */}
      <Box
        display="flex"
        justify-content="space-around"
        align-items="center"
        padding="20px"
        background="--color-lightD2"
      >
        {[
          { title: "Summary", path: "/summary" },
          { title: "Calendar", path: "/calendar" },
          { title: "Orders", path: "/orders" },
          { title: "Add Users", path: "/sudo/users/add" },
        ].map((item, index) => (
          <Text
            key={index}
            onClick={() => history.push(item.path)}
            cursor="pointer"
            margin="0 10px"
            font="--lead"
            padding="10px"
            border-radius="5px"
            transition="background-color 0.3s"
            hover-background="--color-light"
            hover-color="--primary"
          >
            {item.title}
          </Text>
        ))}
      </Box>

      {/* Main Calendar Content */}
      <Section padding="90px 0 100px 0">
        <Text font="normal 500 48px/1.2 --fontFamily-serifGeorgia" text-align="center">
          Calendar
        </Text>

        <Box padding="20px" display="flex" flexDirection="column" alignItems="center">
          <Calendar
            onChange={onDateChange}
            value={selectedDate}
            tileContent={tileContent}
            onActiveStartDateChange={({ activeStartDate }) => loadEventsForMonth(activeStartDate)}
          />
          <Box marginTop="40px" width="100%">
            <Box as="table" width="100%" marginTop="20px" borderCollapse="collapse">
              <thead>
                <tr>
                  <th style={{ padding: '10px', textAlign: 'left' }}>Date</th>
                  <th style={{ padding: '10px', textAlign: 'left' }}>Time</th>
                  <th style={{ padding: '10px', textAlign: 'left' }}>Customer Name</th>
                  <th style={{ padding: '10px', textAlign: 'left' }}>Order UUID</th>
                </tr>
              </thead>
              <tbody>
                {getEventsForDate(selectedDate).length > 0 ? (
                  getEventsForDate(selectedDate).map((event, index) => (
                    <tr key={index}>
                      <td style={{ padding: '10px', textAlign: 'left', minWidth: '120px' }}>{event.deadline}</td>
                      <td style={{ padding: '10px', textAlign: 'left', minWidth: '100px' }}>{event.orderCreationTime}</td>
                      <td style={{ padding: '10px', textAlign: 'left' }}>{event.customer_name}</td>
                      <td style={{ padding: '10px', textAlign: 'left' }}>{event.uuid}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="4" style={{ textAlign: 'center', padding: '10px' }}>
                      {selectedDate.toDateString() === new Date().toDateString() ? "No events for today" : "No events for this date"}
                    </td>
                  </tr>
                )}
              </tbody>
            </Box>
          </Box>
        </Box>

        {/* Toast Notification */}
        {toastMessage && (
          <Box 
            background="--color-lightD2" 
            padding="10px" 
            borderRadius="5px" 
            textAlign="center" 
            marginTop="20px"
            onClick={() => setToastMessage(null)} // Close toast on click
            cursor="pointer"
          >
            {toastMessage}
          </Box>
        )}
      </Section>
    </Theme>
  );
};

export default CalendarPage;