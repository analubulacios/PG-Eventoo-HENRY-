import style from './CreateEventForm.module.css'
import Lateral from './Lateral/Lateral';
import BasicInfo from './Basic Information/BasicInfo'
import MoreInfo from './MoreInfo/MoreInfo';
import Category from './Category/Category';
import DateTime from './Date&Time/DateTime';
import Tickets from './Tickets/Tickets';
import { clear, createEvent } from '../../Slice/CreateEvent/CreateEvent'
import { useSelector, useDispatch } from 'react-redux';
import { useState } from 'react';
import { useEffect } from 'react';
import UploadImage from './UploadImage/UploadImage';
import { getBankAccounts } from '../../Slice/BankAcount/BankAcount';
import ModalFormEvent from '../Modal/ModalFormEvent/ModalFormEvent';
import { useNavigate, useSearchParams } from 'react-router-dom'
import CheckOut from '../Checkout card/CheckoutCard';
import PackSelection from './PackSelection/PackSelection';
import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import AlertTitle from '@mui/material/AlertTitle';
import ModalCreate from '../Modal/ModalCreate/ModalCreate';

function Form() {
  const dispatch = useDispatch();
  const { event, preference_id, loading, error } = useSelector(state => state.event);
  const { isLogged } = useSelector(state => state.user);
  const [selectedModality, setSelectedModality] = useState('Presential');
  const [showModal, setShowModal] = useState(false);
  const MP_PUBLIC_KEY = process.env.REACT_APP_MP_PUBLIC_KEY

  const stgData = JSON.parse(localStorage.getItem("formEvent"))

  const navigate = useNavigate()

  useEffect(() => {
    isLogged && dispatch(getBankAccounts());
  }, []);

  function addCheckout() {
    const mp = new window.MercadoPago(MP_PUBLIC_KEY, {
      locale: 'es-AR'
    });
  
    mp.checkout({
      preference: {
        id: preference_id,
      },
      autoOpen: true,
      theme: {
        elementsColor: '#007F80'
      }
    });
  }

  const [created, setCreated]= useState(false);

  useEffect(() => {
    if (preference_id) {
      const script = document.createElement('script');
      script.type = 'text/javascript';
      script.src = 'https://sdk.mercadopago.com/js/v2';
      script.addEventListener('load', addCheckout);
      document.body.appendChild(script);
    } else if(preference_id === false) {
      // dispatch(createEvent(input));
      setCreated(true);
      // navigate('/Event/' + event.id + '?checkout=true')
      setTimeout(() => {
        navigate('/Event/' + event.id + '?checkout=true')
      }, 2000); // 2 segundos de retraso
    }

    return () => {
      dispatch(clear())
    }

  }, [preference_id]);


  const initialState = {
    address_line: null,
    adversiting_end: null,
    advertisingTime_start: null,
    age_range: 'ALL PUBLIC',
    bankAccount: '',
    category: '',
    city: null,
    country: null,
    cover_pic: null,
    description: null,
    disability_access: null,
    end_date: '',
    end_time: '',
    guests_capacity: "",
    modality: 'Presential',
    isPaid: true,
    isPremium: false,
    isPublic: true,
    items: null,
    large_description:'',
    name: '',
    parking: null,
    pet_friendly: null,
    placeName: null,
    price: null,
    smoking_zone: null,
    start_date: '',
    start_time: '',
    state: null,
    typePack: null,
    virtualURL: '',
    zip_code: null,
    privateEvent_password: '',
  }


  const [input, setInput] = useState(initialState);
  const [errors, setErrors] = useState({});
  const [showMsg, setShowMsg] = useState({});

  function validate(input) {
    let errors = {}
    if (!input.description) { errors.description = 'Description es required' };
    if (input.name.length === 0) {
      errors.name = "Title is required";
    } else if (input.name.length < 4) {
      errors.name = "Title must have at least 4 characters";
    } else if (input.name.length > 40) {
      errors.name = "Title must have a maximum of 40 characters";
    }
    if (!input.category) { errors.category = 'You must select a category' }

    const urlRegex =/^(ftp|http|https):\/\/(?:www\.)?[^ "]+$/;

    if (selectedModality === 'Virtual' && (input.virtualURL === null || input.virtualURL.length === 0)) {
      errors.virtualURL = "URL is required";
    } else if (selectedModality === 'Virtual' && !urlRegex.test(input.virtualURL)) {
      errors.virtualURL = "Invalid URL";
    }
    if (!input.address_line && input.modality === 'Presential') { errors.address_line = 'Address is required' };

    const now = new Date();
    const startDate = new Date(input.start_date);

    if (!input.start_date) { errors.start_date = 'Start date is required'
    }else if (startDate < now) { errors.start_date = 'Start date cannot be in the past' }
    // if (!input.end_date) {
    //   errors.end_date = 'End date is required'
    // } else if (input.end_date < input.start_date) { errors.end_date = 'End date can not be before the start date' }
    if (!input.start_time) { errors.start_time = 'Start time is required' }
    if (!input.end_time) { errors.end_time = 'End time is required'
  } else if (input.start_time >= input.end_time) {errors.end_time = 'End time can not be before the start time'}
    // if (input.start_date === input.end_date) {
    //   const start = new Date(`${input.start_date} ${input.start_time}`);
    //   const end = new Date(`${input.end_date} ${input.end_time}`);
    //   if (start >= end) {
    //     errors.end_time = 'End time can not be before the start time';
    //   }
    // }
    const num = parseInt(input.guests_capacity)
    if (!input.guests_capacity) {
      errors.guests_capacity = 'Capacity is required'
    } else if (isNaN(num) || num < 0) { errors.guests_capacity = 'Enter a valid number' };

    if (input.isPaid === true && (input.price === null || input.price.length === 0)) {
      errors.price = 'Price is required'
    } else if ((input.isPaid === true) && isNaN(parseInt(input.price)) || (parseInt(input.pice)) < 0) {
      errors.price = 'Enter a valid number';
    }

    if (input.isPublic === false && input.privateEvent_password.length === 0) {
      errors.privateEvent_password = "Password is required";
    } else if ((input.isPublic === false) && input.privateEvent_password.length < 6) {
      errors.privateEvent_password = "Password must be at least 6 characters length";
    }

    console.log(errors)
    return errors;
  }

  const [confirm, setConfirm] = useState(null)
  const [query] = useSearchParams()

  useEffect(() => {
    setErrors(validate(input));
    if (confirm !== null) {
      localStorage.setItem("formEvent", JSON.stringify(input));
      localStorage.setItem("lastTime", new Date());
    }
    console.log(input);
  }, [input]);

  useEffect(() => {
    if (stgData && stgData.name !== null & stgData.name.length > 0) {
      if(query.get('checkout_failed') === 'true' || query.get('checkout_failed') === true ) { 
        setConfirm(true)
      } else {
        setShowModal(true)
      }
    } else {
      setConfirm(false)
    }
  }, [])


  useEffect(() => {
    if (confirm === true) {
      setInput(stgData)
    } else if (confirm === false) {
      localStorage.removeItem("formEvent");
      localStorage.removeItem("lastTime");
    }
  }, [confirm]);



  return (
    <div className={style.container}>
      {showModal && <ModalFormEvent stgData={stgData} setConfirm={setConfirm} setShowModal={setShowModal} />}
      {created && <ModalCreate  eventId={event.id} setConfirm={setConfirm} setShowModal={setShowModal} />}
        {/* {error ?
          <Stack sx={{ width: '100%' }} spacing={2}>
            <Alert severity="error">There was an error at creating event - Please verify everything it's rigth.</Alert>
          </Stack> :
          preference_id ? <Stack sx={{ width: '100%' }} spacing={2}>
            <Alert severity="success">Event Created succesfully.</Alert>
            <Alert severity="success">
              <AlertTitle>Success</AlertTitle>
              This is a success alert — <strong>check it out!</strong>
            </Alert>
          </Stack> : undefined} */}
      {/* <Lateral/> */}
      <div className={style.form} >
        {/* <h1 className={style.title}>EVENT INFORMATION</h1>
        <div className={style.containerimg}> <h3 className={style.subtitle}>Upload your event image</h3></div> */}
        <UploadImage input={input} setInput={setInput} errors={errors} showMsg={showMsg} setShowMsg={setShowMsg} loading={loading} />
        <div className={style.split}></div>
        <BasicInfo input={input} setInput={setInput} errors={errors} showMsg={showMsg} setShowMsg={setShowMsg} loading={loading} />
        <MoreInfo input={input} setInput={setInput} errors={errors} showMsg={showMsg} setShowMsg={setShowMsg} loading={loading}/>
        <div className={style.split}></div>
        <h1 className={style.title}>LOCATION AND CATEGORY</h1>
        <Category input={input} setInput={setInput} errors={errors} showMsg={showMsg} setShowMsg={setShowMsg} selectedModality={selectedModality} setSelectedModality={setSelectedModality} loading={loading}/>
        <div className={style.split}></div>
        <DateTime input={input} setInput={setInput} errors={errors} showMsg={showMsg} setShowMsg={setShowMsg} loading={loading}/>
        <div className={style.split}></div>
        <Tickets input={input} setInput={setInput} errors={errors} showMsg={showMsg} setShowMsg={setShowMsg} loading={loading}/>
        <div className={style.split}></div>
        <PackSelection input={input} setInput={setInput} />
      </div>
      <CheckOut errors={errors} isLogged={isLogged} input={input} setConfirm={setConfirm} confirm={confirm} />
    </div>
  )
};

export default Form;