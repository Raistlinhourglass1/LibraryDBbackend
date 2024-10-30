import Container from 'react-bootstrap/Container';
import Nav from 'react-bootstrap/Nav';
import Navbar from 'react-bootstrap/Navbar';
import NavDropdown from 'react-bootstrap/NavDropdown';

function NavBar() {
  return (
    <Navbar expand="lg" className="bg-body-tertiary" bg="dark" data-bs-theme="dark">
      <Container>
        <Navbar.Brand href="#home">Library</Navbar.Brand>
        <Navbar.Toggle aria-controls="basic-navbar-nav" />
        <Navbar.Collapse id="basic-navbar-nav">
          <Nav className="me-auto">
            <Nav.Link href="/">Home</Nav.Link> 
            <Nav.Link href="/search">Search</Nav.Link>
            <Nav.Link href="/reserve-room">Room reservation</Nav.Link>
            <Nav.Link href="/feedback">Book Reviews</Nav.Link>
            <Nav.Link href="/_bookReservation">Book Reservation</Nav.Link>
            <NavDropdown title="Rent Device" id="basic-nav-dropdown">
              <NavDropdown.Item href="/_laptopReservation">Laptops</NavDropdown.Item>
              <NavDropdown.Item href="/_calculatorReservation">
                Calculator
              </NavDropdown.Item>
              <NavDropdown.Divider />
              <NavDropdown.Item href="#action/3.4">
                Schedule return
              </NavDropdown.Item>
            </NavDropdown>
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
}

export default NavBar;
