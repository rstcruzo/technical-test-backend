const {
  colors,
  CssBaseline,
  ThemeProvider,
  Typography,
  Container,
  TextField,
  Fab,
  Button,
  Box,
  Card,
  CardContent,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  makeStyles,
  createMuiTheme
} = MaterialUI;

const {
  withCookies,
  CookiesProvider
} = ReactCookie;

const axiosInstance = axios.create({
  baseURL: "http://localhost:8000",
  headers: {
    'Content-Type': 'application/json'
  }
});

const theme = createMuiTheme({
  palette: {
    primary: {
      main: '#556cd6',
    }
  },
});

class NewNoteDialog extends React.Component {
  state = {
    noteTitle: "",
    noteContent: ""
  }

  handleClose = () => {
    this.props.onClose();
  }

  setNoteTitle = (event) => {
    this.setState({noteTitle: event.target.value});
  }

  setNoteContent = (event) => {
    this.setState({noteContent: event.target.value});
  }

  createNote = () => {
    axiosInstance.post('notes', {
      title: this.state.noteTitle,
      content: this.state.noteContent
    }, {
      headers: {
        'Authorization': 'Bearer ' + this.props.cookies.get('auth_token')
      }
    }).then(response => {
      this.handleClose();
    }).catch(error => {
      console.log(error);
    });
  }

  render = () => {
    return (
      <Dialog onClose={this.handleClose} open={this.props.open}>
        <DialogTitle>New Note</DialogTitle>
        <DialogContent>
          <TextField
            variant="outlined"
            fullWidth
            label="Title"
            onChange={this.setNoteTitle}/>
          <TextField
            variant="outlined"
            fullWidth
            label="Content"
            multiline
            rows={4}
            onChange={this.setNoteContent}/>
        </DialogContent>
        <DialogActions>
          <Button color="primary" variant="contained" onClick={this.createNote}>
            Create
          </Button>
          <Button color="primary" onClick={this.handleClose}>
            Cancel
          </Button>
        </DialogActions>
      </Dialog>
    )
  }
}

NewNoteDialog = withCookies(NewNoteDialog);

class NotesList extends React.Component {

  constructor(props) {
    super(props);

    this.state = {
      notes: [],
      newDialogOpened: false
    }

    this.fetchNotes();
  }

  fetchNotes = () => {
    axiosInstance.get('notes', {
      headers: {
        'Authorization': 'Bearer ' + this.props.cookies.get('auth_token')
      }
    }).then(response => {
      this.setState({notes: response.data})
    })
  }

  closeDialog = () => {
    this.setState({newDialogOpened: false});

    this.fetchNotes();
  }

  openDialog = () => {
    this.setState({newDialogOpened: true});
  }

  render = () => {
    const notes = this.state.notes.map(note => {
      return (
        <Card key={note.id} style={{margin: 20, padding: 15}}>
          <Typography gutterBottom variant="h5" component="h2">
            {note.title}
          </Typography>
          <Typography variant="body2" color="textSecondary" component="p">
            {note.content}
          </Typography>
        </Card>
      )
    })

    return (
      <div>
        <Typography variant="h4" component="h1" gutterBottom>
          My Notes
        </Typography>
        <Fab
          style={{position: 'absolute', bottom: 20, right: 20}}
          color="primary"
          onClick={this.openDialog}>
          <h2>+</h2> {/* This should be AddIcon */}
        </Fab>
        {notes}
        <NewNoteDialog
          open={this.state.newDialogOpened}
          onClose={this.closeDialog} />
      </div>
    );
  }
}


class App extends React.Component {

  constructor(props) {
    super(props);

    const { cookies } = props;
    const auth_token = cookies.get('auth_token');

    this.state = {
      username: "",
      password: "",
      logged: !!auth_token
    }
  }

  login = () => {
    const { cookies } = this.props;

    axiosInstance.post('login', {
      username: this.state.username,
      password: this.state.password
    }).then(response => {
      cookies.set('auth_token', response.data.auth_token);
      this.setState({logged: true});
    });
  }

  register = () => {
    axiosInstance.post('register', {
      username: this.state.username,
      password: this.state.password
    }).then(response => {
      this.login();
    });
  }

  setUsername = (event) => {
    this.setState({username: event.target.value})
  }

  setPassword = (event) => {
    this.setState({password: event.target.value})
  }

  logout = () => {
    const { cookies } = this.props;
    cookies.remove('auth_token');
    this.setState({logged: false});
  }

  render = () => {
    const { cookies } = this.props;

    var content = null;
    if (this.state.logged) {
      content = (
        <div>
          <NotesList cookies={cookies}/>
          <Button
            style={{position: 'absolute', left: 20, bottom: 20}}
            onClick={this.logout}>
            Logout
          </Button>
        </div>
      )
    } else {
      content = (
        <div>
          <Typography variant="h4" component="h1" gutterBottom>
            Login
          </Typography>
          <TextField
            fullWidth
            label="Username"
            onChange={this.setUsername}/>
          <TextField
            fullWidth
            label="Password"
            type="password"
            onChange={this.setPassword}/>
          <Box pt={3}>
            <Button color="primary" variant="contained" onClick={this.login}>
              Login
            </Button>
            <Button color="primary" onClick={this.register}>
              Register
            </Button>
          </Box>
        </div>
      )
    }

    return (
      <Container maxWidth="sm">
        <div style={{marginTop: 24}}>
          {content}
        </div>
      </Container>
    )
  }
}

App = withCookies(App);

ReactDOM.render(
  <ThemeProvider theme={theme}>
    <CssBaseline />
    <CookiesProvider>
      <App />
    </CookiesProvider>
  </ThemeProvider>,
  document.querySelector('#root'),
);
