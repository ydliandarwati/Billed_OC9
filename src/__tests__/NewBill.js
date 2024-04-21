/**
 * @jest-environment jsdom
 */

import "@testing-library/jest-dom";
import { screen, fireEvent, getByTestId, waitFor, within } from "@testing-library/dom";
import mockStore from "../__mocks__/store.js";
import NewBill from "../containers/NewBill.js";
import { ROUTES, ROUTES_PATH } from "../constants/routes.js";
import { localStorageMock } from "../__mocks__/localStorage.js";
import router from "../app/Router.js";
import Bills from "../containers/Bills.js";
import { bills } from "../fixtures/bills.js";

// import NewBillUI from "../views/NewBillUI.js";
import userEvent from "@testing-library/user-event";

jest.mock("../app/Store", () => mockStore);

const getFile = (fileName, fileType) => {
	const file = new File(["img"], fileName, {
	  type: [fileType],
	});
  
	return file;
  };

  const getExpenseName = () => screen.getByTestId("expense-name");

  const getAmount = () => screen.getByTestId("amount");
  
  const getDate = () => screen.getByTestId("datepicker");
  
  const getVat = () => screen.getByTestId("vat");
  
  const getPct = () => screen.getByTestId("pct");
  
  const getCommentary = () => screen.getByTestId("commentary");
  

  const selectExpenseType = expenseType => {
	const dropdown = screen.getByRole("combobox");
	userEvent.selectOptions(
	  dropdown,
	  within(dropdown).getByRole("option", { name: expenseType })
	);
	return dropdown;
  };

describe("When I am on NewBill Page", () => {
  beforeEach(() => {
    Object.defineProperty(window, "localStorage", { value: localStorageMock });
    window.localStorage.setItem(
      "user",
      JSON.stringify({
        type: "Employee",
      })
    );
    const root = document.createElement("div");
    root.setAttribute("id", "root");
    document.body.append(root);
    router();
  });

  test("Then mail icon on verticallayout should be highlighted", async () => {
    window.onNavigate(ROUTES_PATH.NewBill);
    await waitFor(() => screen.getByTestId("icon-mail"));
    const Icon = screen.getByTestId("icon-mail");
    expect(Icon).toHaveClass("active-icon");
  });

  describe ("When I am on NewBill form", () => {
    test("Then I add File", async () => {
      const dashboard = new NewBill({
        document,
        onNavigate,
        store: mockStore,
        localStorage: localStorageMock,
      });
  
      const handleChangeFile = jest.fn(dashboard.handleChangeFile);
      const inputFile = screen.getByTestId("file");
      inputFile.addEventListener("change", handleChangeFile);
      fireEvent.change(inputFile, {
        target: {
          files: [
            new File(["document.jpg"], "document.jpg", {
              type: "document/jpg",
            }),
          ],
        },
      });
  
      expect(handleChangeFile).toHaveBeenCalled();
      expect(handleChangeFile).toBeCalled();
      expect(screen.getByText("Envoyer une note de frais")).toBeTruthy();
    });
  })
});

/* Api */
describe("When I am on NewBill Page and submit the form", () => {
  beforeEach(() => {
    jest.spyOn(mockStore, "bills");
    Object.defineProperty(window, "localStorage", { value: localStorageMock });
    window.localStorage.setItem(
      "user",
      JSON.stringify({
        type: "Employee",
        email: "a@a",
      })
    );
    const root = document.createElement("div");
    root.setAttribute("id", "root");
    document.body.appendChild(root);
    router();
  });

//   describe("user submit form valid", () => {
//     test("call api update bills", async () => {
//       const newBill = new NewBill({
//         document,
//         onNavigate,
//         store: mockStore,
//         localeStorage: localStorageMock,
//       });
//       const handleSubmit = jest.fn(newBill.handleSubmit);
//       const form = screen.getByTestId("form-new-bill");
//       form.addEventListener("submit", handleSubmit);
//       fireEvent.submit(form);
//       expect(mockStore.bills).toHaveBeenCalled();
//     });
//   });


});

// TODO 7 POST Bill
describe("When I do fill fields in correct format and I click on submit button", () => {
	test("Then the submission process should work properly, and I should be sent on the Bills Page", async () => {
	  const onNavigate = pathname => {
		document.body.innerHTML = ROUTES({ pathname });
	  };

	  const newBill = new NewBill({
		document,
		onNavigate,
		store: mockStore,
		localStorage: window.localStorage,
	  });

	  const inputData = bills[0];

	  const newBillForm = screen.getByTestId("form-new-bill");

	  const handleSubmit = jest.fn(newBill.handleSubmit);
	  const imageInput = screen.getByTestId("file");

	  const file = getFile(inputData.fileName, ["image/jpg"])

	  const fileValidation = jest.spyOn(newBill, "fileValidation");

	  // On remplit les champs
	  selectExpenseType(inputData.type);
	  userEvent.type(getExpenseName(), inputData.name);
	  userEvent.type(getAmount(), inputData.amount.toString());
	  userEvent.type(getDate(), inputData.date);
	  userEvent.type(getVat(), inputData.vat.toString());
	  userEvent.type(getPct(), inputData.pct.toString());
	  userEvent.type(getCommentary(), inputData.commentary);
	  await userEvent.upload(imageInput, file);

	  // On s'assure que les données entrées requises sont valides
	  expect(selectExpenseType(inputData.type).validity.valueMissing).toBeFalsy();
	//   expect(getDate().validity.valueMissing).toBeFalsy();
	  expect(getAmount().validity.valueMissing).toBeFalsy();
	  expect(getPct().validity.valueMissing).toBeFalsy();
	  expect(fileValidation(file)).toBeTruthy();

	  newBill.fileName = file.name;

	  // On s'assure que le formulaire est soumettable
	  const submitButton = screen.getByRole("button", { name: /envoyer/i });
	  expect(submitButton.type).toBe("submit");

	  // On soumet le formulaire
	  newBillForm.addEventListener("submit", handleSubmit);
	  userEvent.click(submitButton);

	  expect(handleSubmit).toHaveBeenCalledTimes(1);

	  // On s'assure qu'on est bien renvoyé sur la page Bills
	  expect(screen.getByText(/Mes notes de frais/i)).toBeVisible();
	});
	test("Then a new bill should be created", async () => {
		const createBill = jest.fn(mockStore.bills().create);
		const updateBill = jest.fn(mockStore.bills().update);

		const { fileUrl, key } = await createBill();

		expect(createBill).toHaveBeenCalledTimes(1);

		expect(key).toBe("1234");
		expect(fileUrl).toBe("https://localhost:3456/images/test.jpg");

		const newBill = updateBill();

		expect(updateBill).toHaveBeenCalledTimes(1);

		await expect(newBill).resolves.toEqual({
		  id: "47qAXb6fIm2zOKkLzMro",
		  vat: "80",
		  fileUrl:
			"https://firebasestorage.googleapis.com/v0/b/billable-677b6.a…f-1.jpg?alt=media&token=c1640e12-a24b-4b11-ae52-529112e9602a",
		  status: "pending",
		  type: "Hôtel et logement",
		  commentary: "séminaire billed",
		  name: "encore",
		  fileName: "preview-facture-free-201801-pdf-1.jpg",
		  date: "2004-04-04",
		  amount: 400,
		  commentAdmin: "ok",
		  email: "a@a",
		  pct: 20,
		});
	  });
	});