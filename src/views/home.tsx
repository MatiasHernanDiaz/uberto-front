import { Box } from "@mui/material";
import { AxiosError } from "axios";
import { useContext, useEffect, useState } from "react";
import { CardDriver } from "../components/cards/cardDriver";
import { CardTravel } from "../components/cards/cardTravel";
import { FormValues, HomeForm } from "../components/forms/homeForm";
import { msjContext } from "../components/viewLayout/viewLayout";
import { DriverCard, FormDriver, FormEntity } from "../domain/driver";
import { FormPassenger } from "../domain/passenger";
import { TravelCard } from "../domain/travel";
import { driverService } from "../services/driver.service";
import { passengerService } from "../services/passenger.service";
import { useNavigate } from "react-router-dom";
import { analyticsService } from "../services/analytics.service";
import { homeService } from "../services/home.service";

export const Home = () => {
    const isDriver = localStorage.getItem("isDriver") === "true";
    const [card, setCard] = useState<DriverCard[] | TravelCard[] | null>(null);
    const [formInfo, setFormInfo] = useState<FormDriver | FormPassenger>();
    const { showToast } = useContext(msjContext);
    const navigate = useNavigate();
    const [stateInit, setStateInit] = useState<FormValues>({} as FormValues);

    const infoForm = (formValues: FormDriver | FormPassenger) => {
        setFormInfo(formValues);
    };

    const fetchData = async (formInfo: FormDriver | FormPassenger) => {
        const data = new FormEntity(formInfo);
        if (isDriver) {
            try {
                const res = await driverService.getPendingTravels(data);
                setCard(res);
            } catch (e: unknown) {
                showToast((e as AxiosError<unknown>).response!);
            }
        } else {
            try {
                const res = await passengerService.getAvailableDrivers(data);

                setCard(res.cardDrivers as TravelCard[]);
                formInfo.duration = res.time;
                infoForm(formInfo);
            } catch (e: unknown) {
                showToast((e as AxiosError<unknown>).response!);
            }
        }
    };

    const changePage = (data: DriverCard | TravelCard) => {
        analyticsService.logClick(data.name);
        navigate("/confirmation-page", { state: { driver: data, travel: formInfo } });
    };

    // Llamada inicial a homeService.getRedisData()
    useEffect(() => {
        const initializeData = async () => {
            try {
                const redisData = await homeService.getRedisData();
                if (redisData) {
                    setStateInit(redisData);
                }
            } catch (e: unknown) {
                console.log("no se terajeron los datos del redis");
            }
        };

        initializeData();
    }, []); 

    useEffect(() => {
        if (formInfo) {
            fetchData(formInfo);
        }
    }, [formInfo]);

    return (
        <Box sx={{ marginBottom: "4rem" }}>
            <HomeForm fetchData={fetchData} stateInit={stateInit} />
            {isDriver ? (
                card?.map((item, index) => (
                    <CardTravel key={index} value={item as TravelCard} />
                ))
            ) : (
                card?.map((item, index) => (
                    <CardDriver
                        key={index}
                        value={item as DriverCard}
                        onClick={() => changePage(item)}
                    />
                ))
            )}
        </Box>
    );
};