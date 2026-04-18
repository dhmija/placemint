module.exports = (logger) => {
  const allSkills = [
    'JavaScript',
    'React',
    'Node.js',
    'Express.js',
    'MongoDB',
    'Python',
    'Django',
    'Flask',
    'Java',
    'Spring Boot',
    'C++',
    'C#',
    '.NET',
    'SQL',
    'PostgreSQL',
    'MySQL',
    'Git',
    'Docker',
    'Kubernetes',
    'AWS',
    'Azure',
    'Google Cloud',
    'Terraform',
    'Ansible',
    'HTML5',
    'CSS3',
    'Sass',
    'TypeScript',
    'Angular',
    'Vue.js',
    'Ruby on Rails',
    'PHP',
    'Laravel',
    'Swift',
    'Kotlin',
    'React Native',
    'Flutter',
    'Data Analysis',
    'Machine Learning',
    'TensorFlow',
    'PyTorch',
    'Pandas',
    'NumPy',
    'Cybersecurity',
    'Network Security',
    'Penetration Testing',
    'UI/UX Design',
    'Figma',
    'Sketch',
  ];

  return {
    getSkills: (req, res) => {
      const { search } = req.query;

      try {
        if (search) {
          const filteredSkills = allSkills.filter((skill) =>
            skill.toLowerCase().includes(search.toLowerCase())
          );
          res.json(filteredSkills);
        } else {
          res.json(allSkills);
        }
      } catch (error) {
        logger.error(`Error in getSkills: ${error.message}`, { stack: error.stack });
        res.status(500).json({ message: 'Server error' });
      }
    },
  };
};
