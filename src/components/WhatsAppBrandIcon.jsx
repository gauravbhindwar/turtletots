import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faWhatsapp } from '@fortawesome/free-brands-svg-icons';

const byPrefixAndName = {
  fab: {
    whatsapp: faWhatsapp
  }
};

const WhatsAppBrandIcon = ({ className = 'w-5 h-5' }) => {
  return <FontAwesomeIcon icon={byPrefixAndName.fab['whatsapp']} aria-hidden="true" className={className} />;
};

export default WhatsAppBrandIcon;
