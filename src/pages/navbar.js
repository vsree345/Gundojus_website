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
import React from "react";
import { useHistory } from "react-router-dom";

const history = useHistory();

const pages = [
  { title: "Summary", role: "sudo", path: "/summary" },
  { title: "Calendar", role: "sudo", path: "/calendar" },
  { title: "Orders", role: "sudo", path: "/orders" },
  { title: "Add Users", role: "sudo", path: "/sudo/users/add" },
];

export const NavBar = (role, current) => {
  var navbar = "";
  for (let page in pages) {
    if (page.title !== current) {
      if (role === "sudo") {
        navbar += (
          <Box
            display="flex"
            justify-content="space-around"
            align-items="center"
            padding="20px"
            background="--color-lightD2"
          >
            {pages.map((item, index) => (
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
        );
      }
    }
  }
};
