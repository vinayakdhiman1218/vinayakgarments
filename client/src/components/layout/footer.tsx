import { Link } from "wouter";

export default function Footer() {
  return (
    <footer className="bg-gray-50 border-t">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <h3 className="text-lg font-semibold mb-4">Vinayak Garments</h3>
            <p className="text-gray-600">
              Quality clothing for every occasion
            </p>
          </div>

          <div>
            <h4 className="text-sm font-semibold mb-4">Quick Links</h4>
            <ul className="space-y-2">
              <li>
                <Link href="/products">
                  <span className="text-gray-600 hover:text-primary">Products</span>
                </Link>
              </li>
              <li>
                <Link href="/about">
                  <span className="text-gray-600 hover:text-primary">About Us</span>
                </Link>
              </li>
              <li>
                <Link href="/contact">
                  <span className="text-gray-600 hover:text-primary">Contact</span>
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold mb-4">Contact Info</h4>
            <ul className="space-y-2 text-gray-600">
              <li>Vinayak Garments</li>
              <li>Uklana Mandi, Haryana 125113</li>
              <li>Phone: +919467092793</li>
              <li>Email: vinayak.dhiman.012@gmail.com</li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold mb-4">Business Hours</h4>
            <ul className="space-y-2 text-gray-600">
              <li>Mon - Sat: 8:00 AM - 8:00 PM</li>
              <li>Sunday: 8:00 AM - 8:00 PM</li>
            </ul>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t text-center text-gray-600">
          <p>&copy; {new Date().getFullYear()} Vinayak Garments. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}