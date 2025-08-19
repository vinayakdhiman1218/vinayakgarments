
import { motion } from "framer-motion";

export default function About() {
  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-8">About Vinayak Garments</h1>

        <div className="prose prose-lg max-w-none">
          <div className="mb-12">
            <img
              src="https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTB8fGNsb3RoaW5nJTIwc3RvcmV8ZW58MHx8MHx8fDA%3D&auto=format&fit=crop&w=1200&q=80"
              alt="Vinayak Garments Store Interior"
              className="w-full rounded-lg shadow-lg mb-6"
            />
            
            <h2 className="text-2xl font-semibold mb-4">Our Story</h2>
            <p className="text-gray-600 mb-6">
              Founded in 2018, Vinayak Garments has been a trusted name in fashion retail. 
              What started as a small family-owned boutique has grown into one of the region's most respected 
              clothing retailers, serving customers with quality garments and exceptional service.
            </p>
          </div>

          <div className="mb-12">
            <h2 className="text-2xl font-semibold mb-4">Our Commitment</h2>
            <p className="text-gray-600 mb-6">
              At Vinayak Garments, we're committed to providing our customers with not just clothes, 
              but confidence. We believe that when you look good, you feel good, and we're here to 
              help you achieve both.
            </p>
          </div>

          <div className="mb-12">
            <h2 className="text-2xl font-semibold mb-4">Our Leadership</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-6">
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5 }}
                className="bg-white p-6 rounded-xl shadow-md"
              >
                <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 mb-4">
                  <img 
                    src="" 
                    alt="Rajesh Dhiman" 
                    className="w-24 h-24 rounded-full object-cover border-2 border-primary"
                  />
                  <div>
                    <h3 className="text-xl font-semibold">Rajesh Dhiman</h3>
                    <p className="text-primary font-medium">Founder & CEO</p>
                  </div>
                </div>
                <p className="text-gray-600">
                  With over 25 years of experience in the textile and garment industry, Rajesh Dhiman founded Vinayak Garments with a vision to provide high-quality clothing at reasonable prices. His commitment to excellence and customer satisfaction has been the driving force behind the company's success. Under his leadership, Vinayak Garments has established itself as a premier clothing destination in Haryana.
                </p>
              </motion.div>

              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="bg-white p-6 rounded-xl shadow-md"
              >
                <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 mb-4">
                  <img 
                    src="" 
                    alt="Vinayak Dhiman" 
                    className="w-24 h-24 rounded-full object-cover border-2 border-primary"
                  />
                  <div>
                    <h3 className="text-xl font-semibold">Vinayak Dhiman</h3>
                    <p className="text-primary font-medium">Developer & Creative Director</p>
                  </div>
                </div>
                <p className="text-gray-600">
                  Bringing fresh perspectives and technological innovation to the family business, Vinayak Dhiman has taken Vinayak Garments into the digital era. As both a developer and creative director, he blends traditional retail expertise with modern e-commerce practices. His technical skills and design sensibilities have transformed the customer experience both online and in-store, creating a seamless shopping journey for all Vinayak Garments customers.
                </p>
              </motion.div>
            </div>
          </div>

          <div className="mb-12">
            <h2 className="text-2xl font-semibold mb-4">Our Values</h2>
            <ul className="list-disc pl-5 space-y-2 text-gray-600">
              <li>Quality: We source only the finest materials for our garments.</li>
              <li>Affordability: We believe quality fashion should be accessible to all.</li>
              <li>Sustainability: We are committed to reducing our environmental footprint.</li>
              <li>Community: We support local artisans and give back to our community.</li>
              <li>Innovation: We constantly evolve our styles and processes to stay ahead.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
