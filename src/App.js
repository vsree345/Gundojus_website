import React from "react";
import { HashRouter as Router, Route, Switch, Redirect } from "react-router-dom";
import Login from "pages/login";
import Orders from "pages/ordersManagers";
import OrdersAdd from "pages/ordersAdd";
import OrdersEdit from "pages/ordersEdit";
import OrdersView from "pages/ordersView"; // Public access for customers to view orders
import UsersAdd from "pages/sudoAddUser"; // Sudo-only route
import Page404 from "pages/page404";

// Private route for authenticated users (manager or sudo)
const PrivateRoute = ({ component: Component, ...rest }) => {
  const role = sessionStorage.getItem("role");
  return (
    <Route
      {...rest}
      render={(props) =>
        role ? (
          <Component {...props} />
        ) : (
          <Redirect to="/login" />
        )
      }
    />
  );
};

// Sudo-only route
const SudoRoute = ({ component: Component, ...rest }) => {
  const role = sessionStorage.getItem("role");
  return (
    <Route
      {...rest}
      render={(props) =>
        role === "sudo" ? (
          <Component {...props} />
        ) : (
          <Redirect to="/login" />
        )
      }
    />
  );
};

export default function App() {
  return (
    <Router>
      <Switch>
        {/* Public Routes */}
        <Route exact path="/login" component={Login} />
        <Route exact path="/orders/view" component={OrdersView} /> {/* Publicly accessible */}
        
        {/* Private Routes for Authenticated Users */}
        <PrivateRoute exact path="/orders" component={Orders} />
        <PrivateRoute exact path="/orders/add" component={OrdersAdd} />
        <PrivateRoute exact path="/orders/edit" component={OrdersEdit} />

        {/* Sudo Route */}
        <SudoRoute exact path="/sudo/users/add" component={UsersAdd} />

        {/* Redirect to login if no match */}
        <Route exact path="/" component={Login} />
        <Route component={Page404} />
      </Switch>
    </Router>
  );
}
