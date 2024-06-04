import PropTypes from "prop-types";
import React from "react";
import "./styles.css";

export const Footer = ({
  mobile,
  overlapGroupClassName,
  rectangleClassName,
  divClassName,
  divClassNameOverride,
  divClassName1,
  divClassName2,
  divClassName3,
}) => {
  return (
    <div className={`footer ${mobile}`}>
      {mobile === "mobile-3" && <div className={`overlap-group ${overlapGroupClassName}`} />}

      {["footer-mobile", "mobile-3"].includes(mobile) && (
        <div className="group"  />
      )}

      {mobile === "footer-mobile" && (
        <>

      
          <div className="rectangle" />
          <div className="text-wrapper-19">Termini di utilizzo</div>
          <div className="text-wrapper-20">Privacy Policy</div>
          <div className="text-wrapper-21">Cookie Policy</div>
          <div className="text-wrapper-22">Applicazione delle leggi</div>
          <p className="p">© 2024 Parthenope Aste. All rights reserved.</p>
        </>
      )}

      {["footer-desktop", "footer-mobile"].includes(mobile) && <div className="group-5" />}

      {mobile === "footer-desktop" && (
        <>
          <div className="group-6" ></div>
          <div className="rectangle-2" />
          <div className="text-wrapper-23">Termini di utilizzo</div>
          <div className="text-wrapper-24">Privacy Policy</div>
          <div className="text-wrapper-25">Cookie Policy</div>
          <div className="text-wrapper-26">Applicazione delle leggi</div>



          <p className="text-wrapper-30">© 2024 Parthenope Aste. All rights reserved.</p>

        </>
      )}

      {mobile === "mobile-3" && (
        <>
          <div className={`rectangle-3 ${rectangleClassName}`} />
          <div className={`text-wrapper-35 ${divClassName}`}>Termini di utilizzo</div>
          <div className={`text-wrapper-36 ${divClassNameOverride}`}>Privacy Policy</div>
          <div className={`text-wrapper-37 ${divClassName1}`}>Cookie Policy</div>
          <div className={`text-wrapper-38 ${divClassName2}`}>Applicazione delle leggi</div>
          <p className={`text-wrapper-39 ${divClassName3}`}>© 2024 Parthenope Aste. All rights reserved.</p>
        </>
      )}
    </div>
  );
};

Footer.propTypes = {
  mobile: PropTypes.oneOf(["mobile-3", "footer-mobile", "footer-desktop"]),
  group: PropTypes.string,
};
