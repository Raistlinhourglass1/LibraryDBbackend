import React from 'react'
import SignIn from './SignIn'
import { BrowserRouter as Router, Route, Routes, Outlet} from 'react-router-dom';
import SignUp from './SignUp';
import Fines from './TotalFines';
import StudentBookFines from './StudentBookFines';
import ProfilePage2 from './ProfilePage2';
import ProfilePage from './ProfilePage';
import StudentBookRentals from './StudentBookRentals';
import Nice from './Nice'
import StudentRoomReservationTable from './RoomReserveTable';
import 'bootstrap/dist/css/bootstrap.min.css';
import RoomReservation from './RoomReservation';
import Feedback from './feedback';
import CreateRoom from './CreateRoom';
import Reports from './Reports';
import BookSearchResults from './BookSearchResults';
import BookDetail from './BookDetail';
import PeriodicalEntry from './PeriodicalEntry';
import Maintenance from './Maintenance';
import BookEntry from './BookEntry';
import BookSearch from './BookSearch';
import AudioBookEntry from './AudioBookEntry';
import EBookEntry from './EBookEntry';
import AdvancedSearch from './AdvancedSearch';
import _calculatorReservation from './_calculatorReservation'
import _laptopReservation from './_laptopReservation'
import _bookReservation from './_bookReservation'
import _laptopSearch from './_laptopSearch'
import _calculatorEntry from './_calculatorEntry'
import _calculatorSearch from './_calculatorSearch'
import _laptopEntry from './_laptopEntry'
import Navbar from './Navbar'
import Home from './HomePage'

const Layout = () => (
  <div>
  <Navbar />
  <div style={{ padding: '20px' }}>
    <h1>Device Management System</h1>
    <p>Please select a device entry or search from the options above.</p>
    <Outlet />
  </div>
</div>
);


function App() {
  return (
    <Router>
    <Routes>
      <Route path="/home" element={<Home />} />
      {/* Default route to display SignIn when the user goes to "/" */}
      <Route path="/" element={<SignIn />} />
      
      {/* Explicit route for SignIn */}
      <Route path="/signin" element={<SignIn />} />

      {/* Route for SignUp (old value is /signup) */} 
      
      <Route path="/SignUp" element={<SignUp />} />
      <Route path="/fines" element={<Fines />} />
      <Route path="/StudentBookFines" element={<StudentBookFines />} />
      <Route path="/ProfilePage2" element={<ProfilePage2 />} />
      <Route path="/ProfilePage" element={<ProfilePage />} />
      <Route path="/StudentBookRentals" element={<StudentBookRentals />} />
      <Route path="/Nice" element={<Nice />} />
      <Route path="/StudentRoomReservationTable" element={<StudentRoomReservationTable />} />

      <Route path="/create-room" element={<CreateRoom />} />
      <Route path="/reserve-room" element={<RoomReservation />} />
      <Route path="/feedback" element={<Feedback />} />
      <Route path="/reports" element={<Reports />} />
      <Route path="/catalog-entry/book" element={<BookEntry />} />
      <Route path="/catalog-entry/audiobook" element={<AudioBookEntry />} />
      <Route path="/catalog-entry/ebook" element={<EBookEntry />} />
      <Route path="/catalog-entry/periodical" element={<PeriodicalEntry />} />
      <Route path="/search" element={<BookSearch />} />
      <Route path="/advanced-search" element={<AdvancedSearch />} /> 
      <Route path="/search-results" element={<BookSearchResults />} />
      <Route path="/books/:book_id" element={<BookDetail />} />
      <Route path='/_laptopEntry' element = {<_laptopEntry />}></Route>
      <Route path='/_laptopSearch' element = {<_laptopSearch />}></Route>
      <Route path='/_calculatorEntry' element = {<_calculatorEntry />}></Route>
      <Route path='/_calculatorSearch' element = {<_calculatorSearch />}> </Route>
      <Route path= '/_bookReservation' element = {<_bookReservation />}></Route>
      <Route path= '/_laptopReservation' element = {<_laptopReservation />}></Route>
      <Route path= '/_calculatorReservation' element = {<_calculatorReservation />}></Route>

    </Routes>
  </Router>
   
  )
}

export default App