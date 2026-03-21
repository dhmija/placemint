import React from 'react';
import { Box, Container, Typography } from '@mui/material';

// Import all company logos
import aditya from '../assets/companies/aditya.png';
import amazon from '../assets/companies/amazon.png';
import fedex from '../assets/companies/fedex.png';
import flipkart from '../assets/companies/flipkart.png';
import godrej from '../assets/companies/godrej.png';
import infosys from '../assets/companies/infosys.png';
import mahindra from '../assets/companies/mahindra.png';
import myntra from '../assets/companies/myntra.png';
import pepsico from '../assets/companies/pepsico.png';
import tata from '../assets/companies/tata.png';

// TopCompanies: a simple, reusable showcase row for partner company logos.
const TopCompanies = ({ title = 'Top Companies Listing', subtitle = 'Find jobs that fit your career aspirations.' }) => {
  const logos = [
    { src: aditya, alt: 'Aditya' },
    { src: amazon, alt: 'Amazon' },
    { src: fedex, alt: 'FedEx' },
    { src: flipkart, alt: 'Flipkart' },
    { src: godrej, alt: 'Godrej' },
    { src: infosys, alt: 'Infosys' },
    { src: mahindra, alt: 'Mahindra' },
    { src: myntra, alt: 'Myntra' },
    { src: pepsico, alt: 'PepsiCo' },
    { src: tata, alt: 'Tata' },
  ];
  const items = logos;

  return (
    <Box sx={{ py: { xs: 6, md: 10 }, bgcolor: 'transparent' }}>
      <Container maxWidth="lg">
        <Box sx={{ textAlign: 'center', mb: 6 }}>
          <Typography variant="h3" sx={{ fontWeight: 700, color: 'text.primary' }}>
            {title}
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mt: 1 }}>
            {subtitle}
          </Typography>
        </Box>

        <Box sx={{ overflowX: 'auto', scrollBehavior: 'smooth', px: 1, '&::-webkit-scrollbar': { height: '6px' }, '&::-webkit-scrollbar-track': { background: '#f1f1f1', borderRadius: '10px' }, '&::-webkit-scrollbar-thumb': { background: '#888', borderRadius: '10px', '&:hover': { background: '#555' } } }}>
          <Box
            sx={{
              display: 'flex',
              gap: 3,
              alignItems: 'center',
              justifyContent: 'flex-start',
              pb: 2,
              width: 'max-content',
              minWidth: '100%',
            }}
          >
            {items.map((item, idx) => (
              <Box
                key={idx}
                sx={{
                  width: 160,
                  height: 80,
                  bgcolor: '#fff',
                  borderRadius: 2,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 10px 30px rgba(0,0,0,0.06)',
                  border: '1px solid rgba(0,0,0,0.04)',
                  flex: '0 0 auto',
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: '0 12px 40px rgba(0,0,0,0.12)',
                  },
                }}
              >
                <img
                  src={item.src}
                  alt={item.alt}
                  style={{ maxWidth: '90%', maxHeight: '70%', objectFit: 'contain' }}
                />
              </Box>
            ))}
          </Box>
        </Box>
      </Container>
    </Box>
  );
};

export default TopCompanies;
