import Toast from '../../../constants/Toast';
import checkValidation from '../../../validation';

const EventValidation = (
  logo = [],
  banner = [],
  eventName = '',
  phone = '',
  desc = '',
  date = null,
  time = null,
  eventPhoto = [],
  fee = '',
  location = '',
  lat = null,
  lng = null,
  business = null
) => {

  const eventNameErr = checkValidation('fullname', eventName);
  const phoneErr = checkValidation('mobileno', phone);

  if (!logo || logo.length === 0) {
    Toast.error('Event', 'Please upload your organization image');
    return false;
  }

  if (!banner || banner.length === 0) {
    Toast.error('Event', 'Please upload your banner image');
    return false;
  }

  if (!eventName || eventName.trim().length === 0) {
    Toast.error('Event', 'Please enter event name');
    return false;
  }

  if (eventNameErr?.length > 0) {
    Toast.error('Event', eventNameErr);
    return false;
  }

  if (phoneErr?.length > 0) {
    Toast.error('Event', phoneErr);
    return false;
  }

  if (!location || location.length === 0) {
    Toast.error('Event', 'Please enter your event location');
    return false;
  }

  if (lat == null || lng == null) {
    Toast.error('Event', 'Please select valid event location');
    return false;
  }

  if (!desc || desc.trim().length === 0) {
    Toast.error('Event', 'Please provide description');
    return false;
  }

  if (!date) {
    Toast.error('Event', 'Please select event date');
    return false;
  }

  if (!time) {
    Toast.error('Event', 'Please select event time');
    return false;
  }

  if (!eventPhoto || eventPhoto.length == 0) {
    Toast.error('Event', 'Please upload event image');
    return false;
  }

  if (!business) {
    Toast.error('Event', 'Please select business');
    return false;
  }

  if (!fee || fee.length === 0) {
    Toast.error('Event', 'Please add fee amount');
    return false;
  }

  if (!/^\d+(\.\d{1,2})?$/.test(fee)) {
    Toast.error('Event', 'Please enter valid fee amount');
    return false;
  }

  if (Number(fee) <= 0) {
    Toast.error('Event', 'Fee amount must be greater than 0');
    return false;
  }

  return true;
};


export default EventValidation;
