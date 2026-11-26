import {BrowserRouter,Routes,Route,Navigate} from 'react-router-dom';
import Login from './pages/Login/Login';
import Register from './pages/Register/Register';
import Home from './pages/Home/Home';
import Profile from './pages/Profile/Profile';
import Explore from './pages/Explore/Explore';
import Messages from './pages/Messages/Messages';
import NotFound from './pages/NotFound/NotFound';
import Sidebar from './components/Sidebar/Sidebar';
import {AuthProvider,useAuth} from './context/AuthContext';

const ProtectedRoute = ({ children }) => {
    const { token } = useAuth();

    if (!token) {
        return <Navigate to="/" replace />;
    }

    return (
        <>
            <Sidebar />
            {children}
        </>
    );
};

function AppRoutes() {
    const { token } = useAuth();

    return (
        <Routes>
            <Route
                path="/"
                element={
                    token
                        ? <Navigate to="/home" replace />
                        : <Login />
                }
            />

            <Route
                path="/register"
                element={<Register />}
            />

            <Route
                path="/home"
                element={
                    <ProtectedRoute>
                        <Home />
                    </ProtectedRoute>
                }
            />

            <Route
                path="/explore"
                element={
                    <ProtectedRoute>
                        <Explore />
                    </ProtectedRoute>
                }
            />

            <Route
                path="/messages"
                element={
                    <ProtectedRoute>
                        <Messages />
                    </ProtectedRoute>
                }
            />

            <Route
                path="/messages/:id"
                element={
                    <ProtectedRoute>
                        <Messages />
                    </ProtectedRoute>
                }
            />

            <Route
                path="/profile"
                element={
                    <ProtectedRoute>
                        <Profile />
                    </ProtectedRoute>
                }
            />

            <Route
                path="/profile/:id"
                element={
                    <ProtectedRoute>
                        <Profile />
                    </ProtectedRoute>
                }
            />

            <Route
                path="*"
                element={
                    token ? (
                        <ProtectedRoute>
                            <NotFound />
                        </ProtectedRoute>
                    ) : (
                        <Navigate to="/" replace />
                    )
                }
            />
        </Routes>
    );
}

function App() {
    return (
        <BrowserRouter>
            <AuthProvider>
                <AppRoutes />
            </AuthProvider>
        </BrowserRouter>
    );
}

export default App;
