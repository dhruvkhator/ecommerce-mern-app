import { Button } from "../ui/button";
import { Card, CardContent, CardFooter } from "../ui/card";
import { Label } from "../ui/label";

const AddressCard = ({
  addressInfo,
  handleDeleteAddress,
  handleEditAddress,
  setCurrentSelectedAddress,
  selectedId,
}) => {
  return (
    <Card
      onClick={
        setCurrentSelectedAddress
          ? () => setCurrentSelectedAddress(addressInfo)
          : null
      }
      className={`cursor-pointer border-red-700 ${selectedId?._id === addressInfo?._id
          ? "border-red-900 border-[4px]"
          : "border-black"
        }`}
    >
      <CardContent className="grid p-4 gap-4">
      <div>
          <Label className="font-bold">Title:</Label>
          <span className="ml-4 block">{addressInfo?.title}</span>
        </div>
        <div>
          <Label className="font-bold">Address:</Label>
          <span className="ml-4 block">{addressInfo?.street}</span>
        </div>
        <div>
          <Label className="font-bold">City:</Label>
          <span className="ml-4 block">{addressInfo?.city}</span>
        </div>
        <div>
          <Label className="font-bold">State:</Label>
          <span className="ml-4 block">{addressInfo?.state}</span>
        </div>
        <div>
          <Label className="font-bold">Pincode:</Label>
          <span className="ml-4 block">{addressInfo?.pincode}</span>
        </div>
        <div>
          <Label className="font-bold">Phone:</Label>
          <span className="ml-4 block">{addressInfo?.phone}</span>
        </div>
      </CardContent>

      <CardFooter className="p-3 flex justify-between">
        <Button onClick={() => handleEditAddress(addressInfo)}>Edit</Button>
        <Button onClick={() => handleDeleteAddress(addressInfo)}>Delete</Button>
      </CardFooter>
    </Card>
  );
}

export default AddressCard;