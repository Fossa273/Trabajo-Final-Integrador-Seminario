import { BrowserRouter, Routes, Route } from "react-router-dom";

import ProtectedRoute from "./components/ProtectedRoute";
import { ROLES } from "./utils/session";

import Landing from "./pages/landing/Landing";
import AdminHome from "./pages/home/AdminHome";
import ClientHome from "./pages/home/ClientHome";
import Login from "./pages/auth/Login";
import ChangePassword from "./pages/auth/ChangePassword";
import ForgotPassword from "./pages/auth/ForgotPassword";
import ClientList from "./pages/clientes/clientList";
import NewClient from "./pages/clientes/newClient";
import EditClient from "./pages/clientes/editClient";
import MyProfile from "./pages/clientes/MyProfile";
import LoungeList from "./pageslounges/lounges/loungeList";
import NewLounge from "./pageslounges/lounges/newLounge";
import EditLounge from "./pageslounges/lounges/editLounge";
import LoungeTypeList from "./pageslounges/loungetypes/loungeTypeList";
import NewLoungeType from "./pageslounges/loungetypes/newLoungeType";
import EditLoungeType from "./pageslounges/loungetypes/editLoungeType";
import ReservationList from "./pages/reservation/ReservationList";
import ReservationNew from "./pages/reservation/ReservationNew";
import ReservationEdit from "./pages/reservation/ReservationEdit";
import MyReservations from "./pages/reservation/MyReservations";
import EditMyReservation from "./pages/reservation/EditMyReservation";
import ExtraServiceList from "./pages/extraService/extraServiceList";
import NewExtraService from "./pages/extraService/newExtraService";
import PriceList from "./pages/price/priceList";
import NewPrice from "./pages/price/newPrice";
import CardDetailList from "./pages/cardDetail/cardDetailList";
import NewCardDetail from "./pages/cardDetail/newCardDetail";
import EditCardDetail from "./pages/cardDetail/editCardDetail";
import ContractList from "./pages/contract/ContractList";
import ContractDetail from "./pages/contract/ContractDetail";
import PaymentList from "./pages/payment/PaymentList";
import ContractEdit from "./pages/contract/ContractEdit";
import MyContracts from "./pages/contract/MyContracts";

import "./App.css";

const ADMIN = [ROLES.administrador];
const CLIENTE = [ROLES.cliente];
const TODOS = [ROLES.administrador, ROLES.cliente];

function App() {

    return (
        <BrowserRouter>

            <Routes>

                <Route path="/" element={<Landing />} />
                <Route path="/home" element={<Landing />} />

                <Route path="/login" element={<Login />} />
                <Route path="/registro" element={<NewClient />} />
                <Route path="/recuperar-password" element={<ForgotPassword />} />
                <Route
                    path="/cambiar-password"
                    element={
                        <ProtectedRoute roles={TODOS}>
                            <ChangePassword />
                        </ProtectedRoute>
                    }
                />

                <Route
                    path="/admin-home"
                    element={
                        <ProtectedRoute roles={ADMIN}>
                            <AdminHome />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/client-home"
                    element={
                        <ProtectedRoute roles={CLIENTE}>
                            <ClientHome />
                        </ProtectedRoute>
                    }
                />

                <Route
                    path="/client"
                    element={
                        <ProtectedRoute roles={ADMIN}>
                            <ClientList />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/client/new"
                    element={
                        <ProtectedRoute roles={ADMIN}>
                            <NewClient />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/client/edit/:id"
                    element={
                        <ProtectedRoute roles={ADMIN}>
                            <EditClient />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/client/edit/me"
                    element={
                        <ProtectedRoute roles={CLIENTE}>
                            <EditClient />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/my-profile"
                    element={
                        <ProtectedRoute roles={CLIENTE}>
                            <MyProfile />
                        </ProtectedRoute>
                    }
                />

                <Route
                    path="/lounge"
                    element={
                        <ProtectedRoute roles={ADMIN}>
                            <LoungeList />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/lounge/new"
                    element={
                        <ProtectedRoute roles={ADMIN}>
                            <NewLounge />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/lounge/edit/:id"
                    element={
                        <ProtectedRoute roles={ADMIN}>
                            <EditLounge />
                        </ProtectedRoute>
                    }
                />

                <Route
                    path="/loungeType"
                    element={
                        <ProtectedRoute roles={ADMIN}>
                            <LoungeTypeList />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/loungeType/new"
                    element={
                        <ProtectedRoute roles={ADMIN}>
                            <NewLoungeType />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/loungeType/edit/:id"
                    element={
                        <ProtectedRoute roles={ADMIN}>
                            <EditLoungeType />
                        </ProtectedRoute>
                    }
                />

                <Route
                    path="/reservation"
                    element={
                        <ProtectedRoute roles={ADMIN}>
                            <ReservationList />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/reservation/new"
                    element={
                        <ProtectedRoute roles={TODOS}>
                            <ReservationNew />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/reservation/edit/:id"
                    element={
                        <ProtectedRoute roles={ADMIN}>
                            <ReservationEdit />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/my-reservations"
                    element={
                        <ProtectedRoute roles={CLIENTE}>
                            <MyReservations />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/my-reservations/edit/:id"
                    element={
                        <ProtectedRoute roles={CLIENTE}>
                            <EditMyReservation />
                        </ProtectedRoute>
                    }
                />

                <Route
                    path="/extraService"
                    element={
                        <ProtectedRoute roles={ADMIN}>
                            <ExtraServiceList />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/extraService/new"
                    element={
                        <ProtectedRoute roles={ADMIN}>
                            <NewExtraService />
                        </ProtectedRoute>
                    }
                />

                <Route
                    path="/price"
                    element={
                        <ProtectedRoute roles={ADMIN}>
                            <PriceList />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/price/new"
                    element={
                        <ProtectedRoute roles={ADMIN}>
                            <NewPrice />
                        </ProtectedRoute>
                    }
                />

                <Route
                    path="/cardDetail"
                    element={
                        <ProtectedRoute roles={ADMIN}>
                            <CardDetailList />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/cardDetail/new"
                    element={
                        <ProtectedRoute roles={TODOS}>
                            <NewCardDetail />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/cardDetail/edit/:id"
                    element={
                        <ProtectedRoute roles={ADMIN}>
                            <EditCardDetail />
                        </ProtectedRoute>
                    }
                />

                <Route
                    path="/contract"
                    element={
                        <ProtectedRoute roles={ADMIN}>
                            <ContractList />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/contract/edit"
                    element={
                        <ProtectedRoute roles={ADMIN}>
                            <ContractEdit />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/contract/:id"
                    element={
                        <ProtectedRoute roles={TODOS}>
                            <ContractDetail />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/my-contracts"
                    element={
                        <ProtectedRoute roles={CLIENTE}>
                            <MyContracts />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/payment"
                    element={
                        <ProtectedRoute roles={ADMIN}>
                            <PaymentList />
                        </ProtectedRoute>
                    }
                />

            </Routes>

        </BrowserRouter>
    );
}

export default App;
