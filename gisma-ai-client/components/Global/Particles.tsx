import React, { useCallback } from 'react';
import { loadFull } from 'tsparticles';
import { Engine } from 'tsparticles-engine';
import { Particles } from 'react-tsparticles';

const ParticlesBackground: React.FC = () => {
  const particlesInit = useCallback(async (engine: Engine) => {
    try {
      await loadFull(engine);
    } catch (error) {
      console.error('Error loading tsparticles:', error);
    }
  }, []);

  const particlesLoaded = useCallback(async () => {
    // Particles loaded callback
  }, []);

  return (
    <Particles
      id="tsparticles"
      init={particlesInit}
      loaded={particlesLoaded}
      options={{
        background: {
          color: {
            value: 'transparent',
          },
        },
        fpsLimit: 60,
        interactivity: {
          events: {
            onClick: {
              enable: false,
            },
            onHover: {
              enable: true,
              mode: 'grab',
            },
            resize: true,
          },
          modes: {
            grab: {
              distance: 140,
              links: {
                opacity: 0.3,
              },
            },
          },
        },
        particles: {
          color: {
            value: ['#ffffff', '#e3f2fd', '#bbdefb', '#90caf9'],
          },
          links: {
            color: '#ffffff',
            distance: 150,
            enable: true,
            opacity: 0.1,
            width: 1,
          },
          collisions: {
            enable: false,
          },
          move: {
            direction: 'none',
            enable: true,
            outModes: {
              default: 'out',
            },
            random: true,
            speed: 0.3,
            straight: false,
          },
          number: {
            density: {
              enable: true,
              area: 1200,
            },
            value: 80,
          },
          opacity: {
            value: { min: 0.1, max: 0.6 },
            animation: {
              enable: true,
              speed: 0.5,
              minimumValue: 0.1,
            },
          },
          shape: {
            type: 'circle',
          },
          size: {
            value: { min: 1, max: 2.5 },
            animation: {
              enable: true,
              speed: 1,
              minimumValue: 0.1,
            },
          },
        },
        detectRetina: true,
      }}
    />
  );
};

export default ParticlesBackground; 