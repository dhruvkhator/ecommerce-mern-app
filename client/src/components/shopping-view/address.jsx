import { useEffect, useState } from "react";
import CommonForm from "../common/form";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { addressFormControls } from "@/config";
import { useDispatch, useSelector } from "react-redux";
import {
  addNewAddress,
  deleteAddress,
  editaAddress,
  fetchAllAddresses,
} from "@/store/shop/address-slice";
import AddressCard from "./address-card";
import { useToast } from "@/hooks/use-toast";

const initialAddressFormData = {
  title: "",
  street: "",
  city: "",
  state:"",
  phone: "",
  pincode: "",
};

const Address = ({ setCurrentSelectedAddress, selectedId }) => {
  const [formData, setFormData] = useState(initialAddressFormData);
  const [currentEditedId, setCurrentEditedId] = useState(null);
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const { addressList } = useSelector((state) => state.shopAddress);
  const { toast } = useToast();

  const handleManageAddress = (event) => {
    event.preventDefault();

    //console.log(currentEditedId)

    if (addressList?.length >= 3 && currentEditedId === null) {
      setFormData(initialAddressFormData);
      toast({
        title: "You can add max 3 addresses",
        variant: "destructive",
      });

      return;
    }

    currentEditedId !== null
      ? dispatch(
          editaAddress({
            addressId: currentEditedId,
            formData,
          })
        ).then((data) => {
          if (data?.payload?.code ==="SUCCESS") {
            dispatch(fetchAllAddresses());
            setCurrentEditedId(null);
            setFormData(initialAddressFormData);
            toast({
              title: data.payload.message,
            });
          }
        })
      : dispatch(
          addNewAddress({
            ...formData,
          })
        ).then((data) => {
          if (data?.payload?.code ==="SUCCESS" ) {
            dispatch(fetchAllAddresses(user?._id));
            setFormData(initialAddressFormData);
            toast({
              title: data.payload.message,
            });
          }
        });
  }

  const handleDeleteAddress = (getCurrentAddress) => {
    dispatch(
      deleteAddress({ addressId: getCurrentAddress._id })
    ).then((data) => {
      if (data?.payload?.code==="SUCCESS") {
        dispatch(fetchAllAddresses(user?._id));
        toast({
          title: data.payload.message,
        });
      }else{
        toast({
          title: "Error",
          variant: "destructive",
          description: data.payload.message
        })
      }
    });
  }

  const handleEditAddress = (getCuurentAddress) => {
    setCurrentEditedId(getCuurentAddress?._id);
    setFormData({
      ...formData,
      title: getCuurentAddress?.title,
      street: getCuurentAddress?.street,
      city: getCuurentAddress?.city,
      state: getCuurentAddress?.state,
      phone: getCuurentAddress?.phone,
      pincode: getCuurentAddress?.pincode,
    });
  }

  const isFormValid = () => {
    return Object.keys(formData)
      .map((key) => formData[key].trim() !== "")
      .every((item) => item);
  }

  useEffect(() => {
    dispatch(fetchAllAddresses(user?.id));
  }, [dispatch]);


  return (
    <Card>
      <div className="mb-5 p-3 grid grid-cols-1 sm:grid-cols-2  gap-2">
        {addressList && addressList.length > 0
          ? addressList.map((singleAddressItem) => (
              <AddressCard
                selectedId={selectedId}
                handleDeleteAddress={handleDeleteAddress}
                addressInfo={singleAddressItem}
                handleEditAddress={handleEditAddress}
                setCurrentSelectedAddress={setCurrentSelectedAddress}
              />
            ))
          : null}
      </div>
      <CardHeader>
        <CardTitle>
          {currentEditedId !== null ? "Edit Address" : "Add New Address"}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <CommonForm
          formControls={addressFormControls}
          formData={formData}
          setFormData={setFormData}
          buttonText={currentEditedId !== null ? "Edit" : "Add"}
          onSubmit={handleManageAddress}
          isBtnDisabled={!isFormValid()}
        />
      </CardContent>
    </Card>
  );
}

export default Address;